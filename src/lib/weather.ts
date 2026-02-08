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
  
  // Extrakcia dát pre Ráno (8:00), Obed (12:00) a Večer (20:00)
  // Open-Meteo vráti 168 hodín, my potrebujeme indexy pre dnešný deň
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

export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Jasno',
    1: 'Prevažne jasno', 2: 'Polooblačno', 3: 'Zamračené',
    45: 'Hmla', 48: 'Námraza',
    51: 'Mrholenie', 53: 'Mierne mrholenie', 55: 'Husté mrholenie',
    61: 'Slabý dážď', 63: 'Mierny dážď', 65: 'Silný dážď',
    71: 'Slabé sneženie', 73: 'Mierne sneženie', 75: 'Silné sneženie',
    77: 'Snehové krúpy',
    80: 'Slabé prehánky', 81: 'Mierne prehánky', 82: 'Silné prehánky',
    85: 'Slabé snehové prehánky', 86: 'Silné snehové prehánky',
    95: 'Búrka', 96: 'Búrka s krupobitím', 99: 'Silná búrka s krupobitím',
  };
  return descriptions[code] || 'Neznáme';
}