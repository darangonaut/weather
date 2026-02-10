import { GoogleGenerativeAI } from "@google/generative-ai";

export type Persona = 'cynic' | 'theory' | 'coach' | 'optimist';

export const PERSONAS: Record<Persona, { name: string; instruction: string }> = {
  cynic: {
    name: 'Cynik',
    instruction: 'Si extrémne sarkastický cynik. Tvoj tón je drsný a vtipne urážlivý.'
  },
  theory: {
    name: 'Konšpirátor',
    instruction: 'Si paranoidný konšpiračný teoretik. Veríš na HAARP a chemtrails.'
  },
  coach: {
    name: 'Tréner',
    instruction: 'Si agresívny fitness tréner. Žiadne výhovorky, len motivácia krikom.'
  },
  optimist: {
    name: 'Optimista',
    instruction: 'Si neznesiteľne pozitívny človek. V každom počasí vidíš dar.'
  }
};

export async function generateAllWeatherCommentaries(
  weatherData: { 
    temperature: number; 
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    description: string; 
    isDay: boolean;
    timeline: Array<{ label: string; temperature: number }>;
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
    Vži sa do štyroch osobností a napíš vtipný komentár k počasiu a stručnú radu, čo si obliecť (outfit).
    Dôležité: Komentár by mal brať do úvahy nielen aktuálne počasie, ale aj trend na najbližšie dni (či sa ochladí, oteplí alebo začne pršať).
    
    JAZYK: "${lang}"
    KONTEXT:
    Dnešný priebeh: ${weatherData.timeline.map(t => `${t.label}: ${t.temperature}°C`).join(', ')}.
    Aktuálne: ${weatherData.description}, ${weatherData.temperature}°C (pocitovo ${weatherData.apparentTemperature}°C), vlhkosť ${weatherData.humidity}%, vietor ${weatherData.windSpeed} km/h.
    Zajtra: ${weatherData.tomorrow?.description}, ${weatherData.tomorrow?.minTemp}°C až ${weatherData.tomorrow?.maxTemp}°C.
    Pozajtra: ${weatherData.afterTomorrow?.description}, ${weatherData.afterTomorrow?.minTemp}°C až ${weatherData.afterTomorrow?.maxTemp}°C.
    
    OSOBNOSTI:
    1. cynic: ${PERSONAS.cynic.instruction}
    2. theory: ${PERSONAS.theory.instruction}
    3. coach: ${PERSONAS.coach.instruction}
    4. optimist: ${PERSONAS.optimist.instruction}
    
    STRIKTNÉ PRAVIDLO: 
    - Vráť LEN čistý JSON bez markdown značiek.
    - Formát: {
        "cynic": {"text": "...", "outfit": "..."},
        "theory": {"text": "...", "outfit": "..."},
        "coach": {"text": "...", "outfit": "..."},
        "optimist": {"text": "...", "outfit": "..."}
      }
    - "text" má byť vtipný komentár (3-5 viet).
    - "outfit" má byť stručná rada čo na seba (1 veta).
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
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
