export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
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
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,is_day,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Nepodarilo sa získať dáta o počasí');
  }

  const data = await response.json();
  
  return {
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
    time: data.current.time,
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