const { Client } = require("pg");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Parameters for the text generation model
const parameters = {
  temperature: 0.7,
  max_output_tokens: 256,
  top_p: 0.8,
  top_k: 40,
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

// Function to handle the query and generate responses
const getGeminiUsersByCategoryAndState = async (req, res) => {
  const { category, state, description } = req.body;
  const prompt = `Evaluate the user data based on the request to find users in ${state} with a category of ${category} and description "${description}". Provide a response with two arrays: "relevantUsers" and "irrelevantUsers", each containing objects with keys "userId", "name", "phoneNumber", "city", "state", "description", and "relevance". Generate a reason for the relevance of each user's data to the query in 1-2 lines. Format the response as valid JSON. Ensure that the response only contains the required JSON data without any additional formatting.`;

  try {
    console.log("Received request to get users by category and state:", { category, state, description });
    let users = await fetchUsersFromDatabase(state, category, description);

    if (users.length === 0) {
      // if no users found, expand search to other categories in the same state
      users = await fetchUsersFromDatabase(state, '', description);
    }

    if (users.length === 0) {
      // If no users found, return a message
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

    const aiPrompt = `Evaluate the user data for the request in ${state} with category ${category} and description "${description}". User data: ${JSON.stringify(userPromptData)}. Generate a reason for the relevance of each user's data to the query in 1-2 lines. Provide the response in valid JSON format. The response should only include the JSON data as specified.`;

    const aiResponse = await queryGeminiAPI(aiPrompt);
    console.log("Gemini API response:", aiResponse);

    // Ensure the response is parsed as JSON
    let parsedResponse;
    try {
      // Clean up the response by removing any non-JSON characters
      const cleanResponse = aiResponse.replace(/```json|```|\n/g, '').trim();
      parsedResponse = JSON.parse(cleanResponse);

      // Ensure response is an object and contains 'relevantUsers'
      if (Array.isArray(parsedResponse)) {
        parsedResponse = { relevantUsers: parsedResponse, irrelevantUsers: [] };
      } else if (!parsedResponse.relevantUsers || !Array.isArray(parsedResponse.relevantUsers)) {
        throw new Error("Invalid JSON structure: 'relevantUsers' key not found or is not an array.");
      }

    } catch (parseError) {
      console.error("Error parsing Gemini API response:", parseError);
      res.status(500).json({ error: "Error parsing Gemini API response" });
      return;
    }

    // Filter suitable users and format the response
    const usersWithReasons = parsedResponse.relevantUsers.map(user => ({
      userId: user.userId,
      name: user.name,
      phoneNumber: user.phoneNumber,
      city: user.city,
      state: user.state,
      description: user.description,
      reason: user.relevance, // Use the relevance provided by Gemini
    }));

    console.log("Sending response with users and reasons:", usersWithReasons);
    res.json(usersWithReasons);
  } catch (error) {
    console.error("Error getting users by category and state:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getGeminiUsersByCategoryAndState,
};
