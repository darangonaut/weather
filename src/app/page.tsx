'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Cloud, CloudRain, CloudLightning, CloudSnow, User, RefreshCw, AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { Persona, PERSONAS } from '@/lib/gemini';
import { calculateDistance } from '@/lib/utils';

// Version: 1.1.0-split-api
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
  commentary?: string;
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
  const [loadingStatus, setLoadingStatus] = useState('Inicializácia...');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona>('cynic');

  const fetchWeather = async (lat: number, lon: number, forcePersona?: Persona) => {
    const activePersona = forcePersona || persona;
    const lang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'sk';

    // 1. CACHE CHECK
    if (!forcePersona) {
      const cached = localStorage.getItem('weather_cache_v9'); 
      if (cached) {
        const cacheData: CacheData = JSON.parse(cached);
        if (calculateDistance(lat, lon, cacheData.lat, cacheData.lon) < 5 && (Date.now() - cacheData.timestamp) / 1000 / 60 < 30) {
          setWeather(cacheData.data);
          setLoading(false);
          return;
        }
      }
    }

    // 2. WEATHER FETCH (Fast)
    if (!weather) setLoading(true);
    setLoadingStatus('Skenujem oblohu...');
    setError(null);

    try {
      const weatherRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}&lang=${lang}`);
      const weatherData = await weatherRes.json();
      if (weatherData.error) throw new Error(weatherData.error);

      setWeather(weatherData);
      setLoading(false);
      
      // 3. AI COMMENTARY FETCH (Slow - async)
      setIsGeneratingAI(true);
      const aiRes = await fetch('/api/commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: activePersona,
          lang,
          weatherData: {
            temperature: weatherData.temperature,
            description: weatherData.description,
            isDay: weatherData.isDay,
            tomorrow: weatherData.tomorrow,
            afterTomorrow: weatherData.afterTomorrow
          }
        })
      });
      
      const aiData = await aiRes.json();
      if (aiData.commentary) {
        const fullData = { ...weatherData, commentary: aiData.commentary };
        setWeather(fullData);
        localStorage.setItem('weather_cache_v9', JSON.stringify({ lat, lon, timestamp: Date.now(), persona: activePersona, data: fullData }));
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
    let p = saved && PERSONAS[saved] ? saved : 'cynic';
    setPersona(p);
    setLoadingStatus('Hľadám polohu...');
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, p),
      () => { setError('Povoľte GPS.'); setLoading(false); },
      { timeout: 10000 }
    );
  }, []);

  const handlePersonaChange = (newPersona: Persona) => {
    if (newPersona === persona || isGeneratingAI) return;
    setPersona(newPersona);
    localStorage.setItem('last_persona', newPersona);
    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition((pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, newPersona));
    }
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
      <div className="max-w-5xl mx-auto p-4 md:p-12 space-y-6 min-h-screen flex flex-col">
        
        <header className="flex justify-between items-center mb-4 md:mb-8 px-1 shrink-0">
          <div>
            <h1 className="text-xl md:text-3xl font-black italic bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 uppercase tracking-tighter">
              Weather AI ✨
            </h1>
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              Gemma 3 27B
            </div>
          </div>
          {weather && (
            <div className="flex items-center text-slate-400 text-[10px] font-bold uppercase bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800/50">
              <MapPin size={10} className="mr-1.5 text-blue-400" />
              <span className="max-w-[120px] truncate">{weather.locationName}</span>
            </div>
          )}
        </header>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 pb-20">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse"></div>
              <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
                <Loader2 size={48} className="text-blue-400 animate-spin" />
              </div>
            </div>
            <p className="text-lg font-medium text-slate-200 animate-pulse italic">{loadingStatus}</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-red-500/5 border border-red-500/20 p-12 rounded-[2.5rem] text-center backdrop-blur-xl max-w-sm">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4 opacity-50" />
              <p className="text-red-200/80 font-medium mb-6 leading-relaxed">{error}</p>
              <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs tracking-widest transition-all">Skúsiť znova</button>
            </div>
          </div>
        ) : weather ? (
          <div className="flex-1 space-y-4 md:space-y-6 animate-in fade-in duration-700">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {/* TERAZ */}
              <div className="col-span-2 row-span-1 md:row-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 md:p-10 shadow-2xl shadow-blue-900/20 relative overflow-hidden flex flex-col justify-between min-h-[180px] md:min-h-none">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                  {getWeatherIcon(weather.weatherCode, weather.isDay, "w-40 h-40")}
                </div>
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Aktuálne</span>
                  <div className="text-6xl md:text-8xl font-black tracking-tighter mt-2">{Math.round(weather.temperature)}°</div>
                </div>
                <div className="relative z-10 flex items-center gap-2">
                  <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl">
                    {getWeatherIcon(weather.weatherCode, weather.isDay, "w-6 h-6")}
                  </div>
                  <span className="text-xs md:text-sm font-bold uppercase tracking-widest">{weather.description}</span>
                </div>
              </div>

              {/* ZAJTRA */}
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-[2rem] p-5 md:p-8 flex flex-col justify-between hover:border-slate-700 transition-all">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Zajtra</span>
                <div className="my-2">{getWeatherIcon(weather.tomorrow.weatherCode, true, "w-10 h-10")}</div>
                <div>
                  <div className="text-2xl md:text-3xl font-black">{Math.round(weather.tomorrow.maxTemp)}°</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase">{weather.tomorrow.description}</div>
                </div>
              </div>

              {/* POZAJTRA */}
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-[2rem] p-5 md:p-8 flex flex-col justify-between hover:border-slate-700 transition-all">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {(() => {
                    const d = new Date(Date.now() + 172800000).toLocaleDateString('sk-SK', { weekday: 'short' });
                    return d.charAt(0).toUpperCase() + d.slice(1);
                  })()}
                </span>
                <div className="my-2">{getWeatherIcon(weather.afterTomorrow.weatherCode, true, "w-10 h-10")}</div>
                <div>
                  <div className="text-2xl md:text-3xl font-black">{Math.round(weather.afterTomorrow.maxTemp)}°</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase">{weather.afterTomorrow.description}</div>
                </div>
              </div>
            </div>

            {/* AI COMMENTARY */}
            <section className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                <User size={280} />
              </div>
              
              <div className="relative z-10 space-y-6">
                <header className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <User size={14} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-blue-400">{PERSONAS[persona].name}</div>
                      <div className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">
                        {isGeneratingAI ? 'Gemma píše...' : `Aktualizované o ${new Date(weather.time).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                    </div>
                  </div>
                </header>

                {isGeneratingAI || !weather.commentary ? (
                  <div className="space-y-3 py-2 animate-pulse">
                    <div className="h-3 bg-slate-800/50 rounded-full w-full"></div>
                    <div className="h-3 bg-slate-800/50 rounded-full w-5/6"></div>
                    <div className="h-3 bg-slate-800/50 rounded-full w-2/3"></div>
                  </div>
                ) : (
                  <p className="text-lg md:text-2xl font-medium leading-relaxed md:leading-snug text-slate-200 italic animate-in fade-in duration-500">
                    "{weather.commentary.trim()}"
                  </p>
                )}

                <footer className="flex items-center text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 pt-4">
                  <RefreshCw size={10} className={`mr-2 ${isGeneratingAI ? 'animate-spin text-blue-500' : ''}`} />
                  {isGeneratingAI ? 'Pýtam sa Gemmy na názor...' : 'Systém v poriadku'}
                </footer>
              </div>
            </section>
          </div>
        ) : null}

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-slate-900/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-1.5 shadow-2xl z-50 md:relative md:bottom-0 md:left-0 md:translate-x-0 md:max-w-none md:bg-transparent md:border-none md:shadow-none md:p-0">
          <div className="flex items-center justify-between gap-1 md:justify-end md:gap-4">
            {(Object.keys(PERSONAS) as Persona[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePersonaChange(p)}
                disabled={isGeneratingAI}
                className={`flex-1 md:flex-none px-4 py-3 md:py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${
                  persona === p 
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-[1.02]' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                } disabled:opacity-30`}
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