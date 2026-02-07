import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Chýba GEMINI_API_KEY v .env.local");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // Skúsime zoznam modelov cez fetch, pretože SDK niekedy nemá priamy listModels
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("Dostupné modely:");
      data.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
    } else {
      console.log("Žiadne modely nenájdené alebo chyba:", data);
    }
  } catch (error) {
    console.error("Chyba pri získavaní modelov:", error);
  }
}

listModels();
