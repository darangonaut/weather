import { NextRequest, NextResponse } from 'next/server';
import { generateWeatherCommentary, Persona } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { persona, weatherData, lang } = body;

    const commentary = await generateWeatherCommentary(persona as Persona, weatherData, lang);

    return NextResponse.json({ commentary });
  } catch (error: any) {
    console.error('Commentary API Error:', error);
    return NextResponse.json({ error: error.message || 'AI error' }, { status: 500 });
  }
}
