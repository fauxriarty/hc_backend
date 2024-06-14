const { PredictionServiceClient } = require("@google-cloud/aiplatform");
require("dotenv").config();


// function to fetch users from the database
async function fetchUsersFromDatabase(state, category) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  console.log("Connected to the database");

  const query = `
    SELECT u.id, u.name, u.email, u."phoneNumber", u.city, u.state, h.description 
    FROM "User" u
    JOIN "Have" h ON u.id = h."userId"
    WHERE u.state = $1 AND h.category = $2
  `;
  const values = [state, category];

  try {
    console.log(
      "Fetching users from database with state:",
      state,
      "and category:",
      category
    );
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

const clientOptions = {
  apiEndpoint: "us-central1-aiplatform.googleapis.com",
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  location: process.env.GOOGLE_CLOUD_LOCATION,
};

const vertexClient = new PredictionServiceClient(clientOptions);

const parameters = {
  temperature: 0.7,
  maxOutputTokens: 256,
  topP: 0.8,
  topK: 40,
};

async function queryVertexAI(prompt) {
  const endpoint = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/${process.env.GOOGLE_CLOUD_LOCATION}/publishers/google/models/text-bison@001`;
  const instances = [{ content: prompt }];

  try {
    console.log("Connecting to Vertex AI...");
    const [response] = await vertexClient.predict({
      endpoint,
      instances,
      parameters,
    });
    console.log("Connected to Vertex AI successfully.");
    return response.predictions[0].content;
  } catch (error) {
    console.error("Error querying Vertex AI:", error);
    throw error;
  }
}

const getUsersByCategoryAndState = async (req, res) => {
  const { category, state, description } = req.body;
  const prompt = `Based on the location ${state} and category ${category}, find users whose haves match the description "${description}". Provide a list of user IDs and reasons for their suitability.`;

  try {
    console.log("Received request to get users by category and state:", { category, state, description });
    const users = await fetchUsersFromDatabase(state, category);
    const aiPrompt = {
      users: users.map((user) => ({
        userId: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        city: user.city,
        state: user.state,
        description: user.description,
      })),
      description,
    };
    const aiResponse = await queryVertexAI(JSON.stringify(aiPrompt));
    const usersWithReasons = JSON.parse(aiResponse).map((user) => ({
      ...user,
      reason: `User ${user.name} from ${user.city}, ${user.state} has a resource that closely matches the need for "${description}". Their provided resource details: "${user.description}". This makes them a strong candidate for the category "${category}".`,
    }));
    console.log("Sending response with users and reasons:", usersWithReasons);
    res.json(usersWithReasons);
  } catch (error) {
    console.error("Error getting users by category and state:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUsersByCategoryAndState,
};
