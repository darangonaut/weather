export interface WeatherTimelineEntry {
  time: string;
  temperature: number;
  weatherCode: number;
  label: string;
}

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
  timeline: WeatherTimelineEntry[];
  tomorrow?: {
    maxTemp: number;
    minTemp: number;
    weatherCode: number;
  };
  afterTomorrow?: {
    maxTemp: number;
    minTemp: number;
    weatherCode: number;
  };
}

export async function getWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,is_day,weather_code&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Nepodarilo sa získať dáta o počasí');
  }

  const data = await response.json();
  const timelineIndices = [8, 12, 20];
  const timelineLabels = ['Ráno', 'Obed', 'Večer'];
  
  const timeline: WeatherTimelineEntry[] = timelineIndices.map((hour, i) => ({
    time: data.hourly.time[hour],
    temperature: data.hourly.temperature_2m[hour],
    weatherCode: data.hourly.weather_code[hour],
    label: timelineLabels[i]
  }));

  return {
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
    time: data.current.time,
    timeline,
    tomorrow: {
      maxTemp: data.daily.temperature_2m_max[1],
      minTemp: data.daily.temperature_2m_min[1],
      weatherCode: data.daily.weather_code[1],
    },
    afterTomorrow: {
      maxTemp: data.daily.temperature_2m_max[2],
      minTemp: data.daily.temperature_2m_min[2],
      weatherCode: data.daily.weather_code[2],
    }
  };
}

export function getWeatherDescription(code: number, lang: string = 'sk'): string {
  const translations: Record<string, Record<number, string>> = {
    sk: { 0: 'Jasno', 1: 'Prevažne jasno', 2: 'Polooblačno', 3: 'Zamračené', 45: 'Hmla', 61: 'Slabý dážď', 95: 'Búrka' },
    cs: { 0: 'Jasno', 1: 'Převážně jasno', 2: 'Polojasno', 3: 'Zataženo', 45: 'Mlha', 61: 'Slabý déšť', 95: 'Bouřka' },
    en: { 0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 61: 'Slight rain', 95: 'Thunderstorm' },
    de: { 0: 'Klarer Himmel', 1: 'Überwiegend klar', 2: 'Teilweise bewölkt', 3: 'Bedeckt', 45: 'Nebel', 61: 'Leichter Regen', 95: 'Gewitter' },
    es: { 0: 'Cielo despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado', 45: 'Niebla', 61: 'Lluvia ligera', 95: 'Tormenta' },
    fr: { 0: 'Ciel dégagé', 1: 'Principalement dégagé', 2: 'Partiellement nuageux', 3: 'Couvert', 45: 'Brouillard', 61: 'Pluie légère', 95: 'Orage' }
  };

  const l = translations[lang] || translations.en;
  return l[code] || (translations.en[code] || 'Unknown');
}