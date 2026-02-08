import { NextRequest, NextResponse } from 'next/server';
import { generateAllWeatherCommentaries } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weatherData, lang } = body;

    const commentaries = await generateAllWeatherCommentaries(weatherData, lang);

    return NextResponse.json({ commentaries });
  } catch (error: any) {
    console.error('Commentary API Error:', error);
    return NextResponse.json({ error: error.message || 'AI error' }, { status: 500 });
  }
}