'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Cloud, CloudRain, CloudLightning, CloudSnow, User, RefreshCw, AlertCircle, MapPin, Loader2, Wind, Droplets, ThermometerSnowflake, Sunrise, Sunset } from 'lucide-react';
import { Persona, PERSONAS } from '@/lib/gemini';
import { calculateDistance } from '@/lib/utils';

// Version: 1.8.5-ux-rescue-compact
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
    const cached = localStorage.getItem('weather_cache_v39'); 
    if (cached) {
      const cacheData: CacheData = JSON.parse(cached);
      if (calculateDistance(lat, lon, cacheData.lat, cacheData.lon) < 5 && (Date.now() - cacheData.timestamp) / 1000 / 60 < 30) {
        setWeather(cacheData.data);
        setLoading(false);
        return;
      }
    }

    if (!weather) setLoading(true);
    setLoadingStatus('Upratujem bento box...');
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
        localStorage.setItem('weather_cache_v39', JSON.stringify({ lat, lon, timestamp: Date.now(), data: fullData }));
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
    if (newPersona === persona) return;
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
    <main className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-blue-500/30 overflow-x-hidden pb-24 md:pb-12">
      <div className="max-w-4xl mx-auto p-3 md:p-8 space-y-3 md:space-y-6 min-h-screen flex flex-col justify-start">
        
        <header className="flex flex-col gap-0.5 mb-1 px-1 pt-2">
          <h1 className="text-xl md:text-2xl font-black italic bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 uppercase tracking-tighter leading-none">
            Weather AI ✨
          </h1>
          {weather && (
            <div className="flex items-center text-slate-400 text-sm md:text-xl font-bold tracking-tight">
              <MapPin size={14} className="mr-1.5 text-blue-400 shrink-0" />
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
          <div className="space-y-3 md:space-y-4 animate-in fade-in duration-700">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              
              {/* COMPACT RESCUE HERO BOX */}
              <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-800 rounded-[2rem] p-4 md:p-8 shadow-2xl relative overflow-hidden min-h-none border border-white/10 flex items-center">
                
                {/* Subtle Background Icon */}
                <div className="absolute -right-8 -top-8 md:-right-16 md:-top-16 opacity-[0.06] pointer-events-none rotate-12">
                  {getWeatherIcon(weather.weatherCode, weather.isDay, "w-64 h-64 md:w-[30rem] md:h-[30rem]")}
                </div>
                
                <div className="flex w-full items-center justify-between gap-3 md:gap-12 relative z-10">
                  
                  {/* Left: Tighter Stats Grid */}
                  <div className="flex flex-col gap-3 shrink-0">
                    <div className="grid grid-cols-3 gap-1.5 md:gap-3">
                      {[
                        { Icon: ThermometerSnowflake, val: `${Math.round(weather.apparentTemperature)}°`, label: 'Pocit', color: 'text-blue-100' },
                        { Icon: Droplets, val: `${weather.humidity}%`, label: 'Vlh.', color: 'text-cyan-200' },
                        { Icon: Wind, val: `${Math.round(weather.windSpeed)}`, label: 'Vietor', color: 'text-slate-100' }
                      ].map((s, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-md p-2 md:p-4 rounded-xl md:rounded-[1.5rem] flex flex-col items-center border border-white/10 min-w-[65px] md:min-w-[90px]">
                          <s.Icon size={14} className={`${s.color} mb-1 opacity-80`} />
                          <span className="text-sm md:text-xl font-black tabular-nums leading-none">{s.val}</span>
                          <span className="text-[6px] md:text-[8px] font-black uppercase opacity-50 tracking-widest mt-0.5">{s.label}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1.5 md:gap-3">
                      {[
                        { Icon: Sunrise, val: `${Math.round(weather.timeline[0].temperature)}°`, label: 'Ráno', color: 'text-orange-200' },
                        { Icon: Sun, val: `${Math.round(weather.timeline[1].temperature)}°`, label: 'Obed', color: 'text-yellow-100' },
                        { Icon: Sunset, val: `${Math.round(weather.timeline[2].temperature)}°`, label: 'Večer', color: 'text-indigo-100' }
                      ].map((s, i) => (
                        <div key={i} className="bg-black/10 backdrop-blur-md p-2 md:p-4 rounded-xl md:rounded-[1.5rem] flex flex-col items-center border border-white/5 min-w-[65px] md:min-w-[90px]">
                          <s.Icon size={14} className={`${s.color} mb-1 opacity-80`} />
                          <span className="text-sm md:text-xl font-black tabular-nums leading-none">{s.val}</span>
                          <span className="text-[6px] md:text-[8px] font-black uppercase opacity-50 tracking-widest mt-0.5">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Scaled-down Temperature */}
                  <div className="shrink-0 flex flex-col items-end text-right pr-1">
                    <div className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none drop-shadow-lg">
                      {Math.round(weather.temperature)}°
                    </div>
                    <div className="mt-2 md:mt-4 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
                       <span className="text-[8px] md:text-sm font-black uppercase tracking-widest opacity-90">{weather.description}</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* NEXT DAYS - Compact horizontal */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 md:contents">
                {[
                  { label: 'Zajtra', day: weather.tomorrow },
                  { label: (() => {
                    const d = new Date(Date.now() + 172800000).toLocaleDateString('sk-SK', { weekday: 'short' });
                    return d.charAt(0).toUpperCase() + d.slice(1);
                  })(), day: weather.afterTomorrow }
                ].map((item, i) => (
                  <div key={i} className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl md:rounded-[2rem] p-4 md:p-6 flex items-center justify-between shadow-xl">
                    <div className="flex flex-col">
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{item.label}</span>
                      <div className="text-2xl md:text-4xl font-black leading-none">{Math.round(item.day.maxTemp)}°</div>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-xl">
                      {getWeatherIcon(item.day.weatherCode, true, "w-6 h-6 md:w-10 h-10")}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI COMMENTARY - Now more visible! */}
              <section className="md:col-span-2 bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-[2rem] p-6 md:p-10 relative overflow-hidden shadow-2xl flex items-center min-h-[140px]">
                <div className="absolute -right-8 -bottom-8 opacity-[0.02]">
                  <User size={250} />
                </div>
                <div className="relative z-10 w-full">
                  {(!weather.commentaries && isGeneratingAI) ? (
                    <div className="space-y-3 w-full animate-pulse">
                      <div className="h-2.5 bg-slate-800/50 rounded-full w-full"></div>
                      <div className="h-2.5 bg-slate-800/50 rounded-full w-5/6"></div>
                    </div>
                  ) : weather.commentaries ? (
                    <p className="text-base md:text-xl font-medium leading-relaxed text-slate-200 italic">
                      "{weather.commentaries[persona]?.trim()}"
                    </p>
                  ) : null}
                </div>
              </section>
            </div>
          </div>
        ) : null}

        {/* Action Bar */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-lg bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-1 shadow-2xl z-50 md:relative md:bottom-0 md:left-0 md:translate-x-0 md:max-w-none md:bg-transparent md:border-none md:shadow-none md:p-0">
          <div className="flex items-center justify-between gap-1 md:justify-center md:gap-4">
            {(Object.keys(PERSONAS) as Persona[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePersonaChange(p)}
                className={`flex-1 md:flex-none px-2 py-3 md:py-2.5 md:min-w-[120px] rounded-xl text-[9px] md:text-[10px] font-black uppercase transition-all duration-300 ${
                  persona === p 
                    ? 'bg-blue-600 text-white shadow-lg' 
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
