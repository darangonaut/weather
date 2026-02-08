'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Cloud, CloudRain, CloudLightning, CloudSnow, User, RefreshCw, AlertCircle, MapPin, Loader2, Wind, Droplets, ThermometerSnowflake, Sunrise, Sunset } from 'lucide-react';
import { Persona, PERSONAS } from '@/lib/gemini';
import { calculateDistance } from '@/lib/utils';

// Version: 1.7.1-readable-stats
interface WeatherTimelineEntry {
  time: string;
  temperature: number;
  weatherCode: number;
  label: string;
}

interface WeatherDay {
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  description: string;
}

interface WeatherResponse {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  description: string;
  commentaries?: Record<Persona, string>;
  locationName: string;
  time: string;
  timeline: WeatherTimelineEntry[];
  tomorrow: WeatherDay;
  afterTomorrow: WeatherDay;
}

interface CacheData {
  lat: number;
  lon: number;
  timestamp: number;
  data: WeatherResponse;
}

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Inicializácia...');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona>('cynic');

  const fetchWeather = async (lat: number, lon: number) => {
    const lang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'sk';
    const cached = localStorage.getItem('weather_cache_v31'); 
    if (cached) {
      const cacheData: CacheData = JSON.parse(cached);
      if (calculateDistance(lat, lon, cacheData.lat, cacheData.lon) < 5 && (Date.now() - cacheData.timestamp) / 1000 / 60 < 30) {
        setWeather(cacheData.data);
        setLoading(false);
        return;
      }
    }

    if (!weather) setLoading(true);
    setLoadingStatus('Kalibrujem optiku...');
    setError(null);

    try {
      const weatherRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}&lang=${lang}`);
      const weatherData = await weatherRes.json();
      if (weatherData.error) throw new Error(weatherData.error);
      setWeather(weatherData);
      setLoading(false);
      
      setIsGeneratingAI(true);
      const aiRes = await fetch('/api/commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, weatherData })
      });
      const aiData = await aiRes.json();
      if (aiData.commentaries) {
        const fullData = { ...weatherData, commentaries: aiData.commentaries };
        setWeather(fullData);
        localStorage.setItem('weather_cache_v31', JSON.stringify({ lat, lon, timestamp: Date.now(), data: fullData }));
      }
    } catch (err: any) {
      setError(err.message || 'Chyba spojenia');
    } finally {
      setLoading(false);
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('last_persona') as Persona;
    if (saved && PERSONAS[saved]) setPersona(saved);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => { setError('Povoľte GPS v nastaveniach.'); setLoading(false); },
      { timeout: 8000 }
    );
  }, []);

  const handlePersonaChange = (newPersona: Persona) => {
    setPersona(newPersona);
    localStorage.setItem('last_persona', newPersona);
  };

  const getWeatherIcon = (code: number, isDay: boolean, size = "w-8 h-8") => {
    const props = { className: size };
    if (code === 0) return isDay ? <Sun {...props} className={`${size} text-yellow-400`} /> : <Moon {...props} className={`${size} text-indigo-300`} />;
    if (code <= 3) return <Cloud {...props} className={`${size} text-slate-400`} />;
    if (code >= 61 && code <= 65) return <CloudRain {...props} className={`${size} text-blue-400`} />;
    if (code >= 95) return <CloudLightning {...props} className={`${size} text-purple-500`} />;
    if (code >= 71 && code <= 77) return <CloudSnow {...props} className={`${size} text-white`} />;
    return <Cloud {...props} className={`${size} text-slate-400`} />;
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-blue-500/30 overflow-x-hidden pb-24 md:pb-0">
      <div className="max-w-5xl mx-auto p-4 md:p-12 space-y-4 md:space-y-6 min-h-screen flex flex-col">
        
        <header className="flex flex-col gap-1 mb-1 px-1">
          <h1 className="text-xl md:text-2xl font-black italic bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 uppercase tracking-tighter leading-none">
            Weather AI ✨
          </h1>
          {weather && (
            <div className="flex items-center text-slate-400 text-lg md:text-2xl font-bold tracking-tight animate-in fade-in slide-in-from-left-2 duration-700">
              <MapPin size={16} className="mr-2 text-blue-400 shrink-0" />
              <span className="truncate">{weather.locationName}</span>
            </div>
          )}
        </header>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <Loader2 size={40} className="text-blue-400 animate-spin opacity-50" />
            <p className="text-sm font-medium text-slate-400 italic">{loadingStatus}</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-red-500/5 rounded-3xl border border-red-500/10">
            <AlertCircle className="w-10 h-10 text-red-500/50 mx-auto mb-4" />
            <p className="text-red-200/70 text-sm mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-800 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Skúsiť znova</button>
          </div>
        ) : weather ? (
          <div className="flex-1 space-y-3 md:space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              
              {/* LARGE READABLE SPLIT HERO BOX */}
              <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden min-h-[300px] md:min-h-[380px] flex items-center">
                
                {/* Background Watermark Icon */}
                <div className="absolute -right-10 -top-10 md:-right-16 md:-top-16 opacity-[0.1] pointer-events-none rotate-12">
                  {getWeatherIcon(weather.weatherCode, weather.isDay, "w-72 h-72 md:w-[30rem] md:h-[30rem]")}
                </div>
                
                <div className="flex w-full items-center justify-between gap-4 md:gap-12 relative z-10">
                  
                  {/* Left Side: 2x3 Grid of LARGE cards */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1 max-w-[280px] md:max-w-none">
                    
                    {/* Stat Cards - UX: Much larger and clearer */}
                    {[
                      { Icon: ThermometerSnowflake, val: `${Math.round(weather.apparentTemperature)}°`, label: 'Pocit', color: 'text-blue-200' },
                      { Icon: Sunrise, val: `${Math.round(weather.timeline[0].temperature)}°`, label: 'Ráno', color: 'text-orange-300' },
                      { Icon: Droplets, val: `${weather.humidity}%`, label: 'Vlhkosť', color: 'text-cyan-300' },
                      { Icon: Sun, val: `${Math.round(weather.timeline[1].temperature)}°`, label: 'Obed', color: 'text-yellow-200' },
                      { Icon: Wind, val: `${Math.round(weather.windSpeed)}`, label: 'Vietor', color: 'text-slate-200' },
                      { Icon: Sunset, val: `${Math.round(weather.timeline[2].temperature)}°`, label: 'Večer', color: 'text-indigo-200' }
                    ].map((s, i) => (
                      <div key={i} className="bg-white/10 backdrop-blur-md p-3 md:p-5 rounded-2xl md:rounded-3xl flex flex-col border border-white/10 shadow-lg">
                        <s.Icon size={18} className={`${s.color} mb-2`} />
                        <span className="text-lg md:text-2xl font-black tabular-nums leading-none mb-1">{s.val}</span>
                        <span className="text-[8px] md:text-[10px] font-black uppercase opacity-50 tracking-[0.1em]">{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Right Side: Clean Massive Temp */}
                  <div className="shrink-0 flex flex-col items-end text-right pl-2">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] opacity-60 mb-2">Aktuálne</span>
                    <div className="text-7xl md:text-[11rem] font-black tracking-tighter leading-none drop-shadow-md">
                      {Math.round(weather.temperature)}°
                    </div>
                    <h2 className="text-[10px] md:text-base font-black uppercase tracking-widest opacity-90 mt-2 md:mt-6 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/5 inline-block">{weather.description}</h2>
                  </div>

                </div>
              </div>

              {/* NEXT DAYS */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 md:contents">
                <div className="bg-slate-900/80 border border-slate-800 rounded-[2rem] p-5 md:p-8 flex flex-col justify-between hover:border-slate-700 transition-all min-h-[130px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Zajtra</span>
                    {getWeatherIcon(weather.tomorrow.weatherCode, true, "w-6 h-6 md:w-10 h-10")}
                  </div>
                  <div>
                    <div className="text-3xl md:text-5xl font-black leading-none">{Math.round(weather.tomorrow.maxTemp)}°</div>
                    <div className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase mt-2 truncate">{weather.tomorrow.description}</div>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-[2rem] p-5 md:p-8 flex flex-col justify-between hover:border-slate-700 transition-all min-h-[130px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                      {(() => {
                        const d = new Date(Date.now() + 172800000).toLocaleDateString('sk-SK', { weekday: 'short' });
                        return d.charAt(0).toUpperCase() + d.slice(1);
                      })()}
                    </span>
                    {getWeatherIcon(weather.afterTomorrow.weatherCode, true, "w-6 h-6 md:w-10 h-10")}
                  </div>
                  <div>
                    <div className="text-3xl md:text-5xl font-black leading-none">{Math.round(weather.afterTomorrow.maxTemp)}°</div>
                    <div className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase mt-2 truncate">{weather.afterTomorrow.description}</div>
                  </div>
                </div>
              </div>

              {/* AI COMMENTARY */}
              <section className="md:col-span-2 bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden flex-1 min-h-[180px] flex items-center">
                <div className="absolute -right-8 -bottom-8 opacity-[0.03]">
                  <User size={280} />
                </div>
                <div className="relative z-10 w-full">
                  {(!weather.commentaries && isGeneratingAI) ? (
                    <div className="space-y-3 w-full animate-pulse">
                      <div className="h-3 bg-slate-800/50 rounded-full w-full"></div>
                      <div className="h-3 bg-slate-800/50 rounded-full w-5/6"></div>
                    </div>
                  ) : weather.commentaries ? (
                    <p className="text-lg md:text-2xl font-medium leading-relaxed text-slate-200 italic animate-in fade-in duration-500">
                      "{weather.commentaries[persona]?.trim()}"
                    </p>
                  ) : null}
                </div>
              </section>
            </div>
          </div>
        ) : null}

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-slate-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-1.5 shadow-2xl z-50 md:relative md:bottom-0 md:left-0 md:translate-x-0 md:max-w-none md:bg-transparent md:border-none md:shadow-none md:p-0">
          <div className="flex items-center justify-between gap-1 md:justify-end md:gap-4">
            {(Object.keys(PERSONAS) as Persona[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePersonaChange(p)}
                className={`flex-1 md:flex-none px-4 py-3 md:py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-200 ${
                  persona === p 
                    ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {PERSONAS[p].name}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}
