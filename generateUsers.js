const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const parameters = {
  temperature: 1.8,
  max_output_tokens: 128,
  top_p: 0.95,
  top_k: 50,
};

const cities = [
  { city: "Mumbai", state: "Maharashtra", pincodes: ["400001", "400002", "400003"] },
  { city: "Delhi", state: "Delhi", pincodes: ["110001", "110002", "110003"] },
  { city: "Bengaluru", state: "Karnataka", pincodes: ["560001", "560002", "560003"] },
  { city: "Hyderabad", state: "Telangana", pincodes: ["500001", "500002", "500003"] },
  { city: "Chennai", state: "Tamil Nadu", pincodes: ["600001", "600002", "600003"] },
  { city: "Kolkata", state: "West Bengal", pincodes: ["700001", "700002", "700003"] },
  { city: "Pune", state: "Maharashtra", pincodes: ["411001", "411002", "411003"] }
];

const sdgs = [
  'Food & Nutrition',
  'Water & Sanitation',
  'Shelter & Housing',
  'Health & Well-being',
  'Primary Education',
  'Vocational Training',
  'Adult Education & Literacy',
  'Skill Development',
  'Employment & Job Creation',
  'Entrepreneurship & Business Development',
  'Energy',
  'Transportation',
  'Waste Management',
  'Gender Equality & Women\'s Empowerment',
  'Social Services',
  'Local & Regional Partnerships',
  'International Aid & Cooperation',
  'Knowledge Sharing Platforms',
  'Volunteer Networks'
];

function getRandomCity() {
  const randomIndex = Math.floor(Math.random() * cities.length);
  return cities[randomIndex];
}

function generatePhoneNumber() {
  const number = Math.floor(6000000000 + Math.random() * 4000000000).toString();
  return number;
}

async function queryGeminiAPI(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: parameters });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    const jsonResponse = text.replace(/```json|```|\n/g, '').trim();
    console.log("JSON Response:", jsonResponse);

    // Split the response into separate JSON objects
    const jsonObjects = jsonResponse.split('}{').map((json, index, array) => {
      if (index === 0) return json + '}';
      if (index === array.length - 1) return '{' + json;
      return '{' + json + '}';
    });

    // Parse each JSON object individually
    const parsedData = jsonObjects.map(json => {
      let sanitizedData = sanitizeJSON(json);
      try {
        return JSON.parse(sanitizedData);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        console.error("Original JSON:", json);
        console.error("Sanitized JSON:", sanitizedData);
        throw error;
      }
    });
    return parsedData[0];
  } catch (error) {
    console.error("Error querying Gemini API:", error);
    throw error;
  }
}

async function generateUniqueUser(userPrompt) {
  let userData;
  for (let i = 0; i < 5; i++) {
    try {
      userData = await queryGeminiAPI(userPrompt);
      const existingUser = await prisma.user.findFirst({
        where: {
          name: userData.name,
          dateOfBirth: new Date(userData.dateOfBirth),
        },
      });
      if (!existingUser) break; // Unique user found
    } catch (error) {
      console.error(`Error generating user data on attempt ${i + 1}:`, error);
      if (i === 4) throw new Error("Failed to generate a unique user name after multiple attempts.");
    }
  }
  return userData;
}

async function generateUniqueHave(havePrompt) {
  let haveData;
  for (let i = 0; i < 5; i++) {
    try {
      haveData = await queryGeminiAPI(havePrompt);
      const existingHave = await prisma.have.findFirst({
        where: { description: haveData.description },
      });
      if (!existingHave) break; // Unique have found
    } catch (error) {
      console.error(`Error generating have data on attempt ${i + 1}:`, error);
      if (i === 4) throw new Error("Failed to generate a unique have entry after multiple attempts.");
    }
  }
  return haveData;
}

async function generateUniqueWish(wishPrompt) {
  let wishData;
  for (let i = 0; i < 5; i++) {
    try {
      wishData = await queryGeminiAPI(wishPrompt);
      const existingWish = await prisma.wish.findFirst({
        where: { description: wishData.description },
      });
      if (!existingWish) break; // Unique wish found
    } catch (error) {
      console.error(`Error generating wish data on attempt ${i + 1}:`, error);
      if (i === 4) throw new Error("Failed to generate a unique wish entry after multiple attempts.");
    }
  }
  return wishData;
}

async function generateUserData() {
  const userPrompt = `
    Generate a unique and realistic user for a social platform. dont give unnecessary extra feedback response just give what asked directly no extra unnecessary characters
    Each should have a new name male or female completely new and random, go for names of different famous actors characters directors from TV shows and movies all over India and USA random each time pick a random year and random movie or show from that year and random character or actor from there. and in their style fill rest of details. but random different each time randomly, city, state, occupation, and date of birth.
    Don't use emojis use only characters that wont throw an error for JSON parsing.
    Return the response in the following JSON format:
    {
      "name": "Rahul Kumar",
      "city": "Mumbai",
      "state": "Maharashtra",
      "occupation": "Software Engineer",
      "dateOfBirth": "1990-01-01"
    }
  `;
  const havePrompt = `
    Generate a unique and realistic 'have' entry for a social platform. dont give unnecessary extra feedback response just give what asked directly no extra unnecessary characters
    Don't use emojis use only characters that wont throw an error for JSON parsing.
    Each entry should include a category from the following list: ${sdgs.join(", ")} and a unique description.
    The descriptions should be diverse and vary in language, style, and tone. Some can sound more like good samaritan offers as well since this is for a rural development project.
    Return the response in the following JSON format ONLY STRICTLY keep it simple and of similar types of responses:
    {
      "category": "Skill Development",
      "description": "Expert in web development and programming."
    }
  `;
  const wishPrompt = `
  Generate a unique and realistic 'wish' entry for a social platform. dont give unnecessary extra feedback response just give what asked directly no extra unnecessary characters
  Don't use emojis use only characters that wont throw an error for JSON parsing.
  Each entry should include a category from the following list: ${sdgs.join(", ")} and a unique description.
  The descriptions should be diverse and vary in language, style, and tone while being simple, should be something that people of rural areas can contribute to as well.
  Also, generate a list of skills that would be required to fulfill the wish.
  Return the response in the following JSON format similarly phrased and kept simple:
  {
    "category": "Primary Education",
    "description": "Looking for someone to teach basic programming.",
    "skills": ["programming", "teaching", "communication"]
  }
`;

  const userData = await generateUniqueUser(userPrompt);
  const haveData = await generateUniqueHave(havePrompt);
  const wishData = await generateUniqueWish(wishPrompt);

  return { user: userData, have: haveData, wish: wishData };
}

async function createUsers() {
  const generatedPhoneNumbers = new Set();

  while (true) {
    try {
      const { user, have, wish } = await generateUserData();

      // Generate unique phone number
      let phoneNumber;
      do {
        phoneNumber = generatePhoneNumber();
      } while (generatedPhoneNumbers.has(phoneNumber));

      generatedPhoneNumbers.add(phoneNumber);

      // Get random city and corresponding state and pincode
      const { city, state, pincodes } = getRandomCity();
      const pincode = pincodes[Math.floor(Math.random() * pincodes.length)];

      await prisma.user.create({
        data: {
          name: user.name,
          phoneNumber: phoneNumber,
          isWhatsApp: true,
          newsletter: true,
          occupation: user.occupation,
          pincode: pincode,
          city: city,
          state: state,
          dateOfBirth: new Date(user.dateOfBirth),
          haves: {
            create: {
              category: have.category,
              description: have.description,
            },
          },
          wishes: {
            create: {
              category: wish.category,
              description: wish.description,
              skills: wish.skills,
            },
          },
        },
      });

      console.log(`Created user: ${user.name} with phone number ${phoneNumber}`);
      await new Promise(resolve => setTimeout(resolve, 15000)); // Wait for 15 seconds before creating the next user
    } catch (error) {
      console.error("Error creating user:", error);
      await new Promise(resolve => setTimeout(resolve, 15000)); // Wait for 15 seconds before retrying
    }
  }
}

function sanitizeJSON(input) {
  if (!input.startsWith('{')) {
    input = '{' + input;
  }
  if (!input.endsWith('}')) {
    input = input + '}';
  }

  let openBraces = (input.match(/{/g) || []).length;
  let closeBraces = (input.match(/}/g) || []).length;

  while (closeBraces > openBraces) {
    input = input.substring(0, input.lastIndexOf('}')) + input.substring(input.lastIndexOf('}') + 1);
    closeBraces--;
  }

  while (openBraces > closeBraces) {
    input = input + '}';
    closeBraces++;
  }

  // Check if the JSON string is cut off
  let lastQuote = input.lastIndexOf('"');
  if (lastQuote % 2 === 0) {
    // The JSON string is cut off, add a closing quote and braces
    input = input.substring(0, lastQuote + 1) + '}';
  }

  // Replace non-standard characters, such as emojis
  let sanitized = input.replace(/[\u0800-\uFFFF]/g, "");

  return sanitized;
}

createUsers()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
