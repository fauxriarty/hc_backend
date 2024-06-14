const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { json } = require('body-parser');
require("dotenv").config();

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const parameters = {
  temperature: 0.95,
  max_output_tokens: 64,
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
    console.log(jsonResponse); 

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

    return parsedData;
  } catch (error) {
    console.error("Error querying Gemini API:", error);
    throw error;
  }
}

async function generateUserData() {
  const userPrompt = `
    Generate a unique and realistic user profile for a social platform.
    Each profile should have a unique indian name, city, state, occupation, and date of birth.
    Ensure that the names generated are different each time.
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
    Generate a unique and realistic 'have' entry for a social platform.
    Each entry should include a category from the following list: ${sdgs.join(", ")} and a unique description.
    The descriptions should be diverse and vary in language, style, and tone. some can be sounding more like good samaritan offers as well
    Return the response in the following JSON format:
    {
      "category": "Skill Development",
      "description": "Expert in web development and programming."
    }
  `;
  const wishPrompt = `
    Generate a unique and realistic 'wish' entry for a social platform.
    Each entry should include a category from the following list: ${sdgs.join(", ")} and a unique description.
    The descriptions should be diverse and vary in language, style, and tone. while being simple
    Return the response in the following JSON format:
    {
      "category": "Primary Education",
      "description": "Looking for someone to teach basic programming."
    }
  `;

  let userData, haveData, wishData;

  // Retry mechanism for fetching valid JSON data
  for (let i = 0; i < 3; i++) {
    try {
      userData = await queryGeminiAPI(userPrompt);
      haveData = await queryGeminiAPI(havePrompt);
      wishData = await queryGeminiAPI(wishPrompt);
      break; // If no error, break out of the loop
    } catch (error) {
      console.error(`Error generating data on attempt ${i + 1}:`, error);
      if (i === 2) throw new Error("Failed to generate valid user data after multiple attempts.");
    }
  }

  return { user: userData, have: haveData, wish: wishData };
}

async function createUsers() {
  const generatedPhoneNumbers = new Set();

  while (true) {
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
          },
        },
      },
    });

    console.log(`Created user: ${user.name} with phone number ${phoneNumber}`);
    await new Promise(resolve => setTimeout(resolve, 5000)); 
  }
}

function sanitizeJSON(input) {
    // replace non-standard characters, such as emojis
    let sanitized = input.replace(/[\u0800-\uFFFF]/g, "");
    return sanitized;
}

createUsers()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
