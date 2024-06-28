const { Client } = require("pg");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const parameters = {
  temperature: 0.55,
  max_output_tokens: 4096,
  top_p: 0.82,
  top_k: 30,
};

// fn to query the Gemini API
async function queryGeminiAPI(prompt) {
  try {
    console.log("Connecting to Gemini API...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: parameters });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    console.log("Connected to Gemini API successfully.");
    return text;
  } catch (error) {
    console.error("Error querying Gemini API:", error);
    throw error;
  }
}

async function fetchUsersFromDatabase(state, category, description) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  console.log("Connected to the database");

  const query = `
    SELECT u.id, u.name, u.email, u."phoneNumber", u.city, u.state, u.pincode, h.description 
    FROM "User" u
    JOIN "Have" h ON u.id = h."userId"
    WHERE u.state = $1 AND (h.category = $2 OR h.description ILIKE '%' || $3 || '%')
  `;
  const values = [state, category, description];

  try {
    console.log("Fetching users from database with state:", state, "and category or description:", category, description);
    const res = await client.query(query, values);
    console.log("Fetched users:", res.rows);
    return res.rows;
  } catch (error) {
    console.error("Error fetching users from database:", error);
    throw error;
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

// fn to fetch all  haves if no relevant user found within given state and category
async function fetchAllHaves() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  console.log("Connected to the database");

  const query = `
    SELECT u.id, u.name, u.email, u."phoneNumber", u.city, u.state, u.pincode, h.description 
    FROM "User" u
    JOIN "Have" h ON u.id = h."userId"
  `;

  try {
    console.log("Fetching all haves from the database");
    const res = await client.query(query);
    return res.rows;
  } catch (error) {
    console.error("Error fetching haves from database:", error);
    throw error;
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

function cleanAndParseHavesJSON(response) {
  try {
    let cleanResponse = response.replace(/```json|```|\n|[^\x20-\x7E]/g, '').trim();

    if (!cleanResponse.endsWith(']')) {
      const lastValidIndex = cleanResponse.lastIndexOf('}');
      cleanResponse = cleanResponse.slice(0, lastValidIndex + 1) + ']';
    }

    if (!cleanResponse.startsWith('[')) {
      cleanResponse = '[' + cleanResponse;
    }

    cleanResponse = cleanResponse.slice(0, cleanResponse.lastIndexOf('}') + 1) + ']';

    return JSON.parse(cleanResponse);
  } catch (error) {
    console.error("Error cleaning and parsing Haves JSON:", error);
    throw new Error("Invalid JSON response from Gemini API");
  }
}

const fetchRelevantHaves = async (userWishes, allHaves) => {
  try {
    const aiPrompt = `Evaluate each of the user's wishes against all the haves descriptions and determine strict relevance.
                      User wishes: ${JSON.stringify(userWishes)}.
                      Haves data: ${JSON.stringify(allHaves)}.
                      Consider only directly related fields and provide clear, specific explanations for relevance.
                      Filter out any haves that are not directly related to the user's wishes or are too broad or stretched.
                      Provide the response in valid JSON format with a structure like: [{"haveId": <haveId>, "description": "<description>", "relevance": "<reason>"}].
                      Ensure that the relevance reasons are directly related to the user's wishes and not a stretch.`;

    let aiResponse;
    try {
      aiResponse = await queryGeminiAPI(aiPrompt);
    } catch (error) {
      console.error("Error querying Gemini API:", error);
      throw new Error("Error querying Gemini API");
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    const parsedResponse = cleanAndParseHavesJSON(aiResponse);

    if (!Array.isArray(parsedResponse)) {
      console.error("Invalid JSON structure: expected an array.");
      throw new Error("Invalid JSON structure from Gemini API");
    }

    const relevantHaves = parsedResponse
      .filter(have => have.relevance && have.relevance.toLowerCase().includes('relevant') && !have.relevance.toLowerCase().includes('stretch'))
      .map(have => {
        const matchedHave = allHaves.find(h => h.id === have.haveId);
        return matchedHave ? { ...matchedHave, relevance: have.relevance } : null;
      })
      .filter(Boolean);

    console.log("Relevant haves:", relevantHaves.map(have => have.description));
    return relevantHaves.length > 0 ? relevantHaves : [];
  } catch (error) {
    console.error("Error fetching relevant haves:", error);
    throw new Error(error.message);
  }
};

const getGeminiUsersByCategoryAndState = async (req, res) => {
  const { category, state, description } = req.body;

  try {
    console.log("Received request to get users by category and state:", { category, state, description });
    let users = await fetchUsersFromDatabase(state, category, description);

    if (users.length === 0) {
      console.log("No users found in the specified category. Expanding search to other categories.");
      users = await fetchUsersFromDatabase(state, '', description);
    }

    if (users.length === 0) {
      console.log("No users found with the expanded search. Searching all haves.");
      users = await fetchAllHaves();
    }

    if (users.length === 0) {
      res.json([{ message: "No users found matching the criteria." }]);
      return;
    }

    const userPromptData = users.map(user => ({
      userId: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      description: user.description,
    }));

    const aiPrompt = `Evaluate the user data for the request in ${state} with category ${category} and description "${description}". User data: ${JSON.stringify(userPromptData)}. Consider synonyms, related fields, equipment, and potential relevance based on the description. Generate a reason for the relevance of each user's data to the query in a detailed, impressive, and sensible manner. Provide the response in valid JSON format. The response should only include the JSON data as specified.`;

    let aiResponse;
    try {
      aiResponse = await queryGeminiAPI(aiPrompt);
    } catch (error) {
      console.error("Error querying Gemini API:", error);
      res.status(500).json({ error: "Error querying Gemini API." });
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log("Gemini API response:", aiResponse);

    const parsedResponse = geminiClean(aiResponse);

    if (!parsedResponse.relevantUsers || !Array.isArray(parsedResponse.relevantUsers)) {
      console.error("Invalid JSON structure: 'relevantUsers' key not found or is not an array.");
      res.status(500).json({ error: "Invalid JSON structure from Gemini API." });
      return;
    }

    parsedResponse.relevantUsers = parsedResponse.relevantUsers.map(user => ({
      ...user,
      relevanceReason: user.relevanceReason ?? `This user, ${user.name}, has experience in ${user.description} which can be very useful in fulfilling the needs for "${description}".`
    }));

    parsedResponse.relevantUsers.sort((a, b) => {
      return b.relevanceReason.localeCompare(a.relevanceReason);
    });

    const usersWithReasons = parsedResponse.relevantUsers
      .map(user => {
        const relevantUser = users.find(u => u.id === user.userId);
        if (relevantUser) {
          return {
            userId: relevantUser.id,
            name: relevantUser.name,
            phoneNumber: relevantUser.phoneNumber,
            city: relevantUser.city,
            state: relevantUser.state,
            pincode: relevantUser.pincode ?? "N/A",
            description: relevantUser.description,
            reason: user.relevanceReason,
            warning: relevantUser.state !== state ? "This user is from a different state." : null,
          };
        }
      })
      .filter(Boolean);

    console.log("Sending response with users and reasons:", usersWithReasons);
    res.json(usersWithReasons.length > 0 ? usersWithReasons : [{ message: "No users found matching the criteria." }]);
  } catch (error) {
    console.error("Error getting users by category and state:", error);
    res.status(500).json({ error: error.message });
  }
};

function geminiClean(response) {
  let parsedResponse;
  try {
    // Attempt to parse the response
    parsedResponse = cleanAndParseJSON(response);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    throw new Error("Failed to parse JSON response.");
  }

  // check if the parsedResponse already has the 'relevantUsers' key and it is an array
  if (!Array.isArray(parsedResponse.relevantUsers)) {
    parsedResponse = { relevantUsers: Array.isArray(parsedResponse) ? parsedResponse : [] };
  }
  return parsedResponse;
}

function cleanAndParseJSON(response) {
  try {
    let cleanResponse = response.replace(/```json|```|\n|[^\x20-\x7E]/g, '').trim();

    if (!cleanResponse.endsWith(']')) {
      const lastValidIndex = cleanResponse.lastIndexOf('}');
      cleanResponse = cleanResponse.slice(0, lastValidIndex + 1) + ']';
    }

    return JSON.parse(cleanResponse);
  } catch (error) {
    console.error("Error cleaning and parsing JSON:", error);
    throw new Error("Invalid JSON response from Gemini API");
  }
}

const fetchRelevantWishes = async (userHaves, allWishes) => {
  try {
    const aiPrompt = `Evaluate each of the user's skills/haves descriptions, against all the wishes' descriptions and determine strict relevance.
                      User skills/haves: ${JSON.stringify(userHaves)}. 
                      Wishes data: ${JSON.stringify(allWishes)}. 
                      Consider ONLY directly synonymous and related fields and provide clear, specific unique explanations for relevance. 
                      Filter out any wishes that are not directly related to the user's "have"s or are too broad or stretched.
                      Provide the response in valid JSON format with a structure like: [{"wishId": <wishId>, "title": "<title>", "relevance": "<reason>"}]. 
                      Ensure that the relevance reasons are directly related to the user's skills and not a stretch.`;

    let aiResponse;
    try {
      aiResponse = await queryGeminiAPI(aiPrompt);
    } catch (error) {
      console.error("Error querying Gemini API:", error);
      throw new Error("Error querying Gemini API");
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    const parsedResponse = cleanAndParseJSON(aiResponse);

    if (!Array.isArray(parsedResponse)) {
      console.error("Invalid JSON structure: expected an array.");
      throw new Error("Invalid JSON structure from Gemini API");
    }

    const relevantWishes = parsedResponse
      .filter(wish => wish.relevance && wish.relevance.toLowerCase().includes('relevant') && !wish.relevance.toLowerCase().includes('stretch'))
      .map(wish => {
        const matchedWish = allWishes.find(w => w.id === wish.wishId);
        return matchedWish ? { ...matchedWish, relevance: wish.relevance } : null;
      })
      .filter(Boolean);

    console.log("Relevant wishes:", relevantWishes.map(wish => wish.title));
    return relevantWishes.length > 0 ? relevantWishes : [];
  } catch (error) {
    console.error("Error fetching relevant wishes:", error);
    throw new Error(error.message);
  }
};

module.exports = {
  getGeminiUsersByCategoryAndState,
  fetchRelevantHaves,
  fetchRelevantWishes,
};
