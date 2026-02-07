import { NextRequest, NextResponse } from 'next/server';
import { getWeatherData, getWeatherDescription } from '@/lib/weather';
import { generateWeatherCommentary, Persona } from '@/lib/gemini';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lon = parseFloat(searchParams.get('lon') || '');
  const persona = (searchParams.get('persona') as Persona) || 'cynic';
  const lang = searchParams.get('lang') || 'sk';

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'Chýbajú súradnice' }, { status: 400 });
  }

  try {
    const weatherData = await getWeatherData(lat, lon);
    const description = getWeatherDescription(weatherData.weatherCode);
    
    // Získanie názvu lokality
    let locationName = 'Neznáma lokalita';
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12&accept-language=${lang}`, {
        headers: { 'User-Agent': 'WeatherAI-MVP/1.0' }
      });
      const geoData = await geoRes.json();
      const addr = geoData.address;
      
      locationName = addr?.city || addr?.town || addr?.village || addr?.hamlet || addr?.suburb || addr?.municipality || addr?.county;
      
      if (!locationName && geoData.display_name) {
        locationName = geoData.display_name.split(',')[0];
      }
      
      if (!locationName) locationName = 'Neznáma lokalita';
    } catch (e) {
      console.error('Geocoding error:', e);
    }

    const commentary = await generateWeatherCommentary(persona, {
      temperature: weatherData.temperature,
      description: description,
      isDay: weatherData.isDay,
      tomorrow: weatherData.tomorrow ? {
        ...weatherData.tomorrow,
        description: getWeatherDescription(weatherData.tomorrow.weatherCode)
      } : undefined,
      afterTomorrow: weatherData.afterTomorrow ? {
        ...weatherData.afterTomorrow,
        description: getWeatherDescription(weatherData.afterTomorrow.weatherCode)
      } : undefined
    }, lang);

    return NextResponse.json({
      ...weatherData,
      description,
      commentary,
      locationName,
      tomorrow: weatherData.tomorrow ? {
        ...weatherData.tomorrow,
        description: getWeatherDescription(weatherData.tomorrow.weatherCode)
      } : undefined,
      afterTomorrow: weatherData.afterTomorrow ? {
        ...weatherData.afterTomorrow,
        description: getWeatherDescription(weatherData.afterTomorrow.weatherCode)
      } : undefined
    });
  } catch (error: any) {
    console.error('Weather API Error:', error);
    return NextResponse.json({ error: error.message || 'Interná chyba servera' }, { status: 500 });
  }
}
