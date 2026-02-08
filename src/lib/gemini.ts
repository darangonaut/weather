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
    // Skúsime JSON mód, ale budeme pripravení na surový text
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    Vži sa do troch rôznych osobností a napíš vtipný komentár k aktuálnemu počasiu a výhľadu.
    
    JAZYK: "${lang}"
    KONTEXT:
    Aktuálne: ${weatherData.description}, ${weatherData.temperature}°C.
    Zajtra: ${weatherData.tomorrow?.description}, do ${weatherData.tomorrow?.maxTemp}°C.
    Pozajtra: ${weatherData.afterTomorrow?.description}.
    
    OSOBNOSTI:
    1. cynic: ${PERSONAS.cynic.instruction}
    2. theory: ${PERSONAS.theory.instruction}
    3. coach: ${PERSONAS.coach.instruction}
    
    STRIKTNÉ PRAVIDLO: Vráť LEN čistý JSON v tomto formáte:
    {
      "cynic": "text...",
      "theory": "text...",
      "coach": "text..."
    }
    Každý text musí mať maximálne 400 znakov.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Odstránenie prípadných markdown značiek (Gemma to niekedy robí aj pri JSON móde)
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
