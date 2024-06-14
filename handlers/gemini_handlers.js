const { Client } = require("pg");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const parameters = {
  temperature: 0.9,
  max_output_tokens: 300,
  top_p: 0.9,
  top_k: 50,
};

// Function to query the Gemini API
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

// Function to fetch users from the database
async function fetchUsersFromDatabase(state, category, description) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  console.log("Connected to the database");

  const query = `
    SELECT u.id, u.name, u.email, u."phoneNumber", u.city, u.state, h.description 
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

// Function to fetch all 'Have' entries
async function fetchAllHaves() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  console.log("Connected to the database");

  const query = `
    SELECT u.id, u.name, u.email, u."phoneNumber", u.city, u.state, h.description 
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

// Function to clean and validate JSON response
function cleanAndParseJSON(response) {
  try {
    // Remove non-JSON characters
    let cleanResponse = response.replace(/```json|```|\n|[^\x20-\x7E]/g, '').trim();

    // Ensure the response ends with a closing bracket if it appears to be cut off
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

// Function to handle the query and generate responses
const getGeminiUsersByCategoryAndState = async (req, res) => {
  const { category, state, description } = req.body;
  const prompt = `Evaluate the user data based on the request to find users in ${state} with a category of ${category} and description "${description}". Include users who have related skills, fields, equipment, or synonyms that could potentially match the query. Provide a response with two arrays: "relevantUsers" and "irrelevantUsers", each containing objects with keys "userId", "name", "phoneNumber", "city", "state", "description", and "relevance". Generate a reason for the relevance of each user's data to the query in 1-2 lines. Only include users in the "relevantUsers" array if they are relevant to the query. Format the response as valid JSON. Ensure that the response only contains the required JSON data without any additional formatting.`;

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
      description: user.description,
    }));

    const aiPrompt = `Evaluate the user data for the request in ${state} with category ${category} and description "${description}". User data: ${JSON.stringify(userPromptData)}. Consider synonyms, related fields, equipment, and potential relevance based on the description. Generate a reason for the relevance of each user's data to the query in 1-2 lines. Provide the response in valid JSON format. The response should only include the JSON data as specified.`;

    const aiResponse = await queryGeminiAPI(aiPrompt);
    console.log("Gemini API response:", aiResponse);

    // Clean and parse the response
    const parsedResponse = cleanAndParseJSON(aiResponse);

    // Ensure response is an object and contains 'relevantUsers'
    let finalParsedResponse;
    if (Array.isArray(parsedResponse)) {
      finalParsedResponse = { relevantUsers: parsedResponse, irrelevantUsers: [] };
    } else if (!parsedResponse.relevantUsers || !Array.isArray(parsedResponse.relevantUsers)) {
      throw new Error("Invalid JSON structure: 'relevantUsers' key not found or is not an array.");
    } else {
      finalParsedResponse = parsedResponse;
    }

    // Filter suitable users and format the response, excluding irrelevant users
    const usersWithReasons = finalParsedResponse.relevantUsers
      .map(user => {
        const relevantUser = users.find(u => u.id === user.userId);
        if (relevantUser) {
          return {
            userId: relevantUser.id,
            name: relevantUser.name,
            phoneNumber: relevantUser.phoneNumber,
            city: relevantUser.city,
            state: relevantUser.state,
            description: relevantUser.description,
            reason: user.relevance,
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

module.exports = {
  getGeminiUsersByCategoryAndState,
};
