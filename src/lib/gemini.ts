import { GoogleGenerativeAI } from "@google/generative-ai";

export type Persona = 'cynic' | 'theory' | 'coach';

export const PERSONAS: Record<Persona, { name: string; instruction: string }> = {
  cynic: {
    name: 'Cynik',
    instruction: 'Si sarkastický cynik. Odpovedaj stručne a úderne (max 5 viet). Buď drsný a vtipný.'
  },
  theory: {
    name: 'Konšpirátor',
    instruction: 'Si paranoidný konšpirátor. Veríš na HAARP a chemtrails. Odpovedaj stručne a rozvláčnejšie (max 5 viet). Neopakuj sa.'
  },
  coach: {
    name: 'Tréner',
    instruction: 'Si agresívny fitness tréner. Žiadne výhovorky, len motivácia krikom. Odpovedaj stručne a intenzívne (max 5 viet).'
  }
};

export async function generateWeatherCommentary(
  persona: Persona,
  weatherData: { 
    temperature: number; 
    description: string; 
    isDay: boolean;
    tomorrow?: { maxTemp: number; minTemp: number; description: string };
    afterTomorrow?: { maxTemp: number; minTemp: number; description: string };
  },
  lang: string = 'sk'
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chýba GEMINI_API_KEY v premenných prostredia');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemma-3-27b-it",
  });

  const personaInstruction = PERSONAS[persona].instruction;
  
  const prompt = `
    ${personaInstruction}
    STRIKTNÉ PRAVIDLO: Tvoja odpoveď musí byť v jazyku "${lang}" a mať maximálne 400 znakov.
    
    KONTEXT:
    Aktuálne: ${weatherData.description}, ${weatherData.temperature}°C.
    Zajtra: ${weatherData.tomorrow?.description}, do ${weatherData.tomorrow?.maxTemp}°C.
    Pozajtra: ${weatherData.afterTomorrow?.description}.
    
    ÚLOHA:
    Napíš vtipný a charakteristický komentár k dnešku a stručný výhľad na ďalšie dni.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemma Error Details:", error);
    throw error;
  }
}
