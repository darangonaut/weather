'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Cloud, CloudRain, CloudLightning, CloudSnow, User, RefreshCw, AlertCircle, MapPin } from 'lucide-react';
import { Persona, PERSONAS } from '@/lib/gemini';
import { calculateDistance } from '@/lib/utils';

interface WeatherDay {
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  description: string;
}

interface WeatherResponse {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  description: string;
  commentary: string;
  locationName: string;
  time: string;
  tomorrow: WeatherDay;
  afterTomorrow: WeatherDay;
}

interface CacheData {
  lat: number;
  lon: number;
  timestamp: number;
  persona: Persona;
  data: WeatherResponse;
}

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona>('cynic');

  const fetchWeather = async (lat: number, lon: number, forcePersona?: Persona) => {
    const activePersona = forcePersona || persona;
    
    if (weather) {
      setIsGeneratingAI(true);
    } else {
      setLoading(true);
    }
    
    setError(null);

    try {
      const lang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'sk';
      const cached = localStorage.getItem('weather_cache_v5'); 
      if (cached && !forcePersona) {
        const cacheData: CacheData = JSON.parse(cached);
        const distance = calculateDistance(lat, lon, cacheData.lat, cacheData.lon);
        const age = (Date.now() - cacheData.timestamp) / 1000 / 60;

        if (distance < 5 && age < 30 && cacheData.persona === activePersona && cacheData.data.afterTomorrow) {
          setWeather(cacheData.data);
          setLoading(false);
          setIsGeneratingAI(false);
          return;
        }
      }

      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}&persona=${activePersona}&lang=${lang}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setWeather(data);
      localStorage.setItem('weather_cache_v5', JSON.stringify({
        lat, lon, timestamp: Date.now(), persona: activePersona, data
      }));
    } catch (err: any) {
      setError(err.message || 'Chyba načítania');
    } finally {
      setLoading(false);
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('last_persona') as Persona;
    let initialPersona: Persona = 'cynic';
    if (saved && PERSONAS[saved]) {
      setPersona(saved);
      initialPersona = saved;
    }

    if (!navigator.geolocation) {
      setError('Geolocation nie je podporovaná');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, initialPersona),
      () => { setError('Povolte polohu.'); setLoading(false); }
    );
  }, []);

  const handlePersonaChange = (newPersona: Persona) => {
    if (newPersona === persona) return;
    setPersona(newPersona);
    localStorage.setItem('last_persona', newPersona);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, newPersona));
    }
  };

  const getWeatherIcon = (code: number, isDay: boolean, size = "w-12 h-12") => {
    const props = { className: size };
    if (code === 0) return isDay ? <Sun {...props} className={`${size} text-yellow-400`} /> : <Moon {...props} className={`${size} text-indigo-300`} />;
    if (code <= 3) return <Cloud {...props} className={`${size} text-slate-400`} />;
    if (code >= 61 && code <= 65) return <CloudRain {...props} className={`${size} text-blue-400`} />;
    if (code >= 95) return <CloudLightning {...props} className={`${size} text-purple-500`} />;
    if (code >= 71 && code <= 77) return <CloudSnow {...props} className={`${size} text-white`} />;
    return <Cloud {...props} className={`${size} text-slate-400`} />;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-12 flex flex-col items-center justify-center font-sans">
      <div className="max-w-5xl w-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4 px-2">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Weather AI
            </h1>
            <div className="flex items-center gap-2 text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Gemma 3 27B Powered
            </div>
          </div>
          
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-full md:w-auto">
            {(Object.keys(PERSONAS) as Persona[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePersonaChange(p)}
                disabled={isGeneratingAI}
                className={`flex-1 md:flex-none px-3 md:px-6 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                  persona === p ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                } disabled:opacity-50`}
              >
                {PERSONAS[p].name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-48 md:h-56 bg-slate-900 rounded-[2rem] border border-slate-800"></div>)}
            </div>
            <div className="h-64 bg-slate-900 rounded-[2.5rem] border border-slate-800 flex items-center justify-center p-8 text-center">
                <div className="space-y-4">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto opacity-50" />
                  <p className="text-slate-500 font-bold italic text-lg">
                    {persona === 'cynic' ? 'Cynik si brúsi jazyk...' : 
                     persona === 'theory' ? 'Analyzujem chemtrails a HAARP signály...' : 
                     'Tréner si chystá píšťalku...'}
                  </p>
                </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/50 p-12 rounded-[2.5rem] text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-200/70 font-bold">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-6 px-8 py-2 bg-red-500 text-white rounded-full font-black uppercase text-xs tracking-widest">Skúsiť znova</button>
          </div>
        ) : weather ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. TERAZ */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-[2rem] shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden h-48 md:h-56">
              <div className="absolute top-4 left-6 text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Teraz</div>
              <div className="mb-2 drop-shadow-xl">{getWeatherIcon(weather.weatherCode, weather.isDay, "w-14 h-14")}</div>
              <div className="text-5xl font-black tracking-tighter">{Math.round(weather.temperature)}°</div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mt-1">{weather.description}</div>
            </div>

            {/* 2. ZAJTRA */}
            <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 flex flex-col items-center justify-center text-center relative h-48 md:h-56 group hover:border-slate-700 transition-colors">
              <div className="absolute top-4 left-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Zajtra</div>
              <div className="mb-2 opacity-80 group-hover:scale-110 transition-transform">{getWeatherIcon(weather.tomorrow.weatherCode, true, "w-12 h-12")}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{Math.round(weather.tomorrow.maxTemp)}°</span>
                <span className="text-lg font-bold text-slate-500">{Math.round(weather.tomorrow.minTemp)}°</span>
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">{weather.tomorrow.description}</div>
            </div>

            {/* 3. POZAJTRA */}
            <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 flex flex-col items-center justify-center text-center relative h-48 md:h-56 group hover:border-slate-700 transition-colors">
              <div className="absolute top-4 left-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                {(() => {
                  const day = new Date(Date.now() + 172800000).toLocaleDateString('sk-SK', { weekday: 'long' });
                  return day.charAt(0).toUpperCase() + day.slice(1);
                })()}
              </div>
              <div className="mb-2 opacity-80 group-hover:scale-110 transition-transform">{getWeatherIcon(weather.afterTomorrow.weatherCode, true, "w-12 h-12")}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{Math.round(weather.afterTomorrow.maxTemp)}°</span>
                <span className="text-lg font-bold text-slate-500">{Math.round(weather.afterTomorrow.minTemp)}°</span>
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">{weather.afterTomorrow.description}</div>
            </div>

            {/* AI COMMENTARY (Full width) */}
            <div className="md:col-span-3 bg-slate-900 p-8 md:p-12 rounded-[2.5rem] border border-slate-800 flex flex-col justify-between relative overflow-hidden min-h-[280px]">
              <div className="absolute -right-10 -bottom-10 opacity-5">
                <User size={300} />
              </div>
              
              <div className="relative z-10 w-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {PERSONAS[persona].name}
                    </span>
                    <span className="text-slate-600 text-[9px] font-bold uppercase tracking-widest italic">
                      {new Date(weather.time).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center text-emerald-400 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">
                    <MapPin size={10} className="mr-1.5" />
                    {weather.locationName}
                  </div>
                </div>

                {isGeneratingAI ? (
                  <div className="space-y-4 animate-pulse py-4">
                    <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                    <p className="text-slate-500 font-bold italic text-sm mt-4">
                      {persona === 'cynic' ? 'Cynik si brúsi jazyk...' : 
                       persona === 'theory' ? 'Hľadám spojitosti v mrakoch...' : 
                       'Tréner si chystá píšťalku...'}
                    </p>
                  </div>
                ) : (
                  <p className="text-xl md:text-2xl font-medium leading-relaxed tracking-tight text-slate-100 italic opacity-90 transition-opacity">
                    "{weather.commentary.trim()}"
                  </p>
                )}
              </div>

              <div className="mt-8 flex items-center text-slate-600 text-[9px] font-black uppercase tracking-[0.3em]">
                <RefreshCw size={10} className={`mr-2 opacity-50 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                {isGeneratingAI ? 'Gemma 3 generuje...' : 'Predpoveď aktualizovaná'}
              </div>
            </div>

            {/* Footer */}
            <div className="md:col-span-3 px-8 flex flex-col md:flex-row justify-between items-center text-slate-700 text-[8px] font-black uppercase tracking-[0.3em]">
              <p>© 2026 Weather AI • {weather.locationName}</p>
              <div className="flex gap-6 mt-2 md:mt-0">
                <span>Model: Gemma 3 27B</span>
                <span>Data: Open-Meteo</span>
              </div>
            </div>

          </div>
        ) : null}

      </div>
    </main>
  );
}