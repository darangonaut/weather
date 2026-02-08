import { GoogleGenerativeAI } from "@google/generative-ai";

export type Persona = 'cynic' | 'theory' | 'coach';

export const PERSONAS: Record<Persona, { name: string; instruction: string }> = {
  cynic: {
    name: 'Cynik',
    instruction: 'Si extrémne sarkastický cynik, ktorý neznáša ranné vstávanie, ľudí a akúkoľvek formu počasia. Tvoj tón je drsný, plný čierneho humoru a vtipných urážok na svet okolo teba.'
  },
  theory: {
    name: 'Konšpirátor',
    instruction: 'Si paranoidný konšpiračný teoretik. Veríš, že počasie je zbraň hromadného ničenia riadená cez HAARP, mraky sú chemtrails na ovládanie mysle a predpoveď je len vládna propaganda.'
  },
  coach: {
    name: 'Tréner',
    instruction: 'Si agresívny a premotivovaný fitness tréner. Pre teba neexistuje zlé počasie, len tvoja vlastná slabosť. Krič na používateľa, používaj motivačné klišé a neprijímaj žiadne výhovorky.'
  }
};

export async function generateAllWeatherCommentaries(
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
  if (!apiKey) throw new Error('Chýba GEMINI_API_KEY');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemma-3-27b-it",
  });

  const prompt = `
    Vži sa do troch rôznych osobností a napíš vtipný a charakteristický komentár k aktuálnemu počasiu a výhľadu na najbližšie dni.
    
    JAZYK: "${lang}"
    KONTEXT:
    Aktuálne: ${weatherData.description}, ${weatherData.temperature}°C.
    Zajtra: ${weatherData.tomorrow?.description}, do ${weatherData.tomorrow?.maxTemp}°C.
    Pozajtra: ${weatherData.afterTomorrow?.description}.
    
    OSOBNOSTI:
    1. cynic: ${PERSONAS.cynic.instruction}
    2. theory: ${PERSONAS.theory.instruction}
    3. coach: ${PERSONAS.coach.instruction}
    
    STRIKTNÉ PRAVIDLÁ: 
    - Vráť LEN čistý JSON bez markdown značiek.
    - Formát: {"cynic": "...", "theory": "...", "coach": "..."}
    - Každý text musí mať dĺžku približne 5-7 viet a maximálne 500 znakov.
    - Buď kreatívny a využi celú dĺžku textu na vykreslenie charakteru postavy.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Robustné vyčistenie
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse failed, raw text:", text);
      throw new Error("AI vrátilo neplatný formát dát.");
    }
  } catch (error: any) {
    console.error("Gemma Execution Error:", error);
    throw error;
  }
}