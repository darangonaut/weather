'use client';

import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Cloud, CloudRain, CloudLightning, CloudSnow, User, RefreshCw, AlertCircle, MapPin, Loader2, Wind, Droplets, ThermometerSnowflake, Sunrise, Sunset, HelpCircle, X, Share, Download, Shirt, MoreVertical } from 'lucide-react';
import { Persona, PERSONAS } from '@/lib/gemini';
import { calculateDistance } from '@/lib/utils';
import { translations } from '@/lib/translations';
import { toPng } from 'html-to-image';

// Version: 1.11.1-robust-share
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
  commentaries?: Record<Persona, { text: string; outfit: string }>;
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

// Version: 1.11.2-force-build
export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona>('cynic');
  const [showHelp, setShowHelp] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [currentLang, setCurrentLang] = useState<'sk' | 'en' | 'cs'>('sk');
  
  const captureRef = useRef<HTMLDivElement>(null);

  const t = translations[currentLang] || translations.en;

  const downloadImage = async () => {
    if (!captureRef.current || isSharing) return;
    
    setIsSharing(true);
    
    // Malý timeout pre istotu
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const dataUrl = await toPng(captureRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#020617',
        // Filter out buttons from the screenshot
        filter: (node) => {
          const isButton = node.tagName === 'BUTTON';
          const isNav = node.tagName === 'NAV';
          return !isButton && !isNav;
        }
      });

      const link = document.createElement('a');
      link.download = `weather-${weather?.locationName || 'ai'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Ospravedlňujeme sa, ale generovanie obrázku v tomto prehliadači zlyhalo.');
    } finally {
      setIsSharing(false);
    }
  };

  const fetchWeather = async (lat: number, lon: number, forcePersona?: Persona) => {
    const activePersona = forcePersona || persona;
    const urlParams = new URLSearchParams(window.location.search);
    const lang = (urlParams.get('lang') || navigator.language.split('-')[0]) as 'sk' | 'en' | 'cs';
    const finalLang = translations[lang] ? lang : 'en';
    setCurrentLang(finalLang);
    
    const cached = localStorage.getItem('weather_cache_v44'); 
    if (cached && !forcePersona && !urlParams.has('lang')) {
      const cacheData: CacheData = JSON.parse(cached);
      if (calculateDistance(lat, lon, cacheData.lat, cacheData.lon) < 5 && (Date.now() - cacheData.timestamp) / 1000 / 60 < 30) {
        setWeather(cacheData.data);
        setLoading(false);
        return;
      }
    }

    if (!weather) setLoading(true);
    setError(null);

    try {
      const weatherRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}&lang=${finalLang}`);
      const weatherData = await weatherRes.json();
      if (weatherData.error) throw new Error(weatherData.error);
      setWeather(weatherData);
      setLoading(false);
      
      const aiRes = await fetch('/api/commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: finalLang, weatherData })
      });
      const aiData = await aiRes.json();
      if (aiData.commentaries) {
        const fullData = { ...weatherData, commentaries: aiData.commentaries };
        setWeather(fullData);
        localStorage.setItem('weather_cache_v44', JSON.stringify({ lat, lon, timestamp: Date.now(), data: fullData }));
      }
    } catch (err: any) {
      setError(err.message || t.weather_error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('last_persona') as Persona;
    if (saved && PERSONAS[saved]) setPersona(saved);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => { setError(t.geo_error); setLoading(false); },
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
    <main className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-blue-500/30 overflow-x-hidden pb-24 md:pb-12">
      <div ref={captureRef} className="max-w-4xl mx-auto p-4 md:p-8 space-y-4 md:space-y-6 min-h-screen flex flex-col justify-start bg-[#020617]">
        
        {/* Header */}
        <header className="flex justify-between items-start mb-1 px-1 pt-2">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl md:text-2xl font-black italic bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 uppercase tracking-tighter leading-none">
              Weather AI ✨
            </h1>
            {weather && (
              <div className="flex items-center text-slate-400 text-lg md:text-2xl font-bold tracking-tight">
                <MapPin size={16} className="mr-2 text-blue-400 shrink-0" />
                <span className="truncate max-w-[180px] md:max-w-none">{weather.locationName}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 no-export">
            {weather && (
              <button onClick={downloadImage} disabled={isSharing} className="p-2 bg-slate-900/50 hover:bg-slate-800 rounded-full border border-slate-800 transition-colors group flex items-center gap-2 px-4 disabled:opacity-50">
                {isSharing ? <Loader2 size={16} className="animate-spin text-blue-400" /> : <Download size={16} className="text-slate-500 group-hover:text-blue-400" />}
                <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-200">{t.share}</span>
              </button>
            )}
            <button onClick={() => setShowHelp(true)} className="p-2 bg-slate-900/50 hover:bg-slate-800 rounded-full border border-slate-800 transition-colors group">
              <HelpCircle size={20} className="text-slate-500 group-hover:text-blue-400" />
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <Loader2 size={40} className="text-blue-400 animate-spin opacity-50" />
            <p className="text-sm font-medium text-slate-400 italic">{t.loading}</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-red-500/5 rounded-3xl border border-red-500/10">
            <AlertCircle className="w-10 h-10 text-red-500/50 mx-auto mb-4" />
            <p className="text-red-200/70 text-sm mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-800 text-white rounded-full text-[10px] font-black uppercase tracking-widest">{t.understood}</button>
          </div>
        ) : weather ? (
          <div className="space-y-3 md:space-y-4 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-800 rounded-[2.5rem] p-5 md:p-10 shadow-2xl relative overflow-hidden min-h-[280px] md:min-h-[340px] flex items-center border border-white/10">
                <div className="absolute -right-12 -top-12 md:-right-20 md:-top-20 opacity-[0.07] pointer-events-none rotate-[15deg]">
                  {getWeatherIcon(weather.weatherCode, weather.isDay, "w-80 h-80 md:w-[35rem] md:h-[35rem]")}
                </div>
                <div className="flex w-full flex-col md:flex-row items-center justify-between gap-8 md:gap-12 relative z-10">
                  <div className="flex flex-col gap-4 shrink-0 w-full md:w-auto">
                    <div className="grid grid-cols-3 gap-2.5 md:gap-3">
                      {[
                        { Icon: ThermometerSnowflake, val: `${Math.round(weather.apparentTemperature)}°`, label: t.feels, color: 'text-blue-100' },
                        { Icon: Droplets, val: `${weather.humidity}%`, label: t.humidity, color: 'text-cyan-200' },
                        { Icon: Wind, val: `${Math.round(weather.windSpeed)}`, label: t.wind, color: 'text-slate-100' }
                      ].map((s, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-md p-3.5 md:p-4 rounded-2xl md:rounded-[1.5rem] flex flex-col items-center border border-white/10 shadow-inner">
                          <s.Icon size={18} className={`${s.color} mb-1.5 opacity-80`} />
                          <span className="text-lg md:text-xl font-black tabular-nums leading-none">{s.val}</span>
                          <span className="text-[7px] md:text-[8px] font-black uppercase opacity-60 tracking-[0.15em]">{s.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2.5 md:gap-3">
                      {[
                        { Icon: Sunrise, val: `${Math.round(weather.timeline[0].temperature)}°`, label: t.morning, color: 'text-orange-200' },
                        { Icon: Sun, val: `${Math.round(weather.timeline[1].temperature)}°`, label: t.noon, color: 'text-yellow-100' },
                        { Icon: Sunset, val: `${Math.round(weather.timeline[2].temperature)}°`, label: t.evening, color: 'text-indigo-100' }
                      ].map((s, i) => (
                        <div key={i} className="bg-black/10 backdrop-blur-md p-3.5 md:p-4 rounded-2xl md:rounded-[1.5rem] flex flex-col items-center border border-white/5 shadow-inner">
                          <s.Icon size={18} className={`${s.color} mb-1.5 opacity-80`} />
                          <span className="text-lg md:text-xl font-black tabular-nums leading-none">{s.val}</span>
                          <span className="text-[7px] md:text-[8px] font-black uppercase opacity-60 tracking-[0.15em]">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end text-right w-full md:w-auto">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] opacity-50 mb-2">{t.current}</span>
                    <div className="text-8xl md:text-9xl lg:text-[11rem] font-black tracking-tighter leading-none relative z-10 drop-shadow-2xl">
                      {Math.round(weather.temperature)}°
                    </div>
                    <div className="mt-4 md:mt-6 bg-white/10 px-5 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg relative z-10">
                       <span className="text-[10px] md:text-base font-black uppercase tracking-[0.2em] opacity-90">{weather.description}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* NEXT DAYS */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 md:contents">
                {[
                  { label: t.tomorrow, day: weather.tomorrow },
                  { label: (() => {
                    const d = new Date(Date.now() + 172800000).toLocaleDateString(currentLang, { weekday: 'short' });
                    return d.charAt(0).toUpperCase() + d.slice(1);
                  })(), day: weather.afterTomorrow }
                ].map((item, i) => (
                  <div key={i} className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-[2rem] p-6 md:p-8 flex flex-col justify-between shadow-xl">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</span>
                      <div className="bg-slate-800/50 p-2 rounded-xl">{getWeatherIcon(item.day.weatherCode, true, "w-6 h-6 md:w-10 h-10")}</div>
                    </div>
                    <div>
                      <div className="text-4xl md:text-5xl font-black leading-none mb-2">{Math.round(item.day.maxTemp)}°</div>
                      <div className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{item.day.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI COMMENTARY & OUTFIT */}
              <section className="md:col-span-2 bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden flex-1 min-h-[220px] shadow-2xl flex flex-col justify-center gap-6">
                <div className="absolute -right-8 -bottom-8 opacity-[0.02]"><User size={300} /></div>
                <div className="relative z-10 w-full">
                  {!weather.commentaries ? (
                    <div className="space-y-4 w-full animate-pulse">
                      <div className="h-3 bg-slate-800/50 rounded-full w-full"></div>
                      <div className="h-3 bg-slate-800/50 rounded-full w-5/6"></div>
                    </div>
                  ) : (
                    <p className="text-lg md:text-2xl font-medium leading-relaxed text-slate-200 italic">"{weather.commentaries[persona]?.text.trim()}"</p>
                  )}
                </div>
                {weather.commentaries && (
                  <div className="relative z-10 bg-blue-500/10 border border-blue-500/20 p-4 rounded-3xl flex items-center gap-4">
                    <div className="bg-blue-500/20 p-3 rounded-2xl shrink-0"><Shirt size={20} className="text-blue-400" /></div>
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-blue-400 block mb-1">{t.outfit}</span>
                      <p className="text-sm text-slate-200 font-medium">{weather.commentaries[persona]?.outfit}</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        ) : null}

        {/* Action Bar */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-lg bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 md:relative md:bottom-0 md:left-0 md:translate-x-0 md:max-w-none md:bg-transparent md:border-none md:shadow-none md:p-0 md:mt-4">
          <div className="flex items-center justify-between gap-1.5 md:justify-center md:gap-4">
            {(Object.keys(PERSONAS) as Persona[]).map((p) => (
              <button key={p} onClick={() => handlePersonaChange(p)} className={`flex-1 md:flex-none px-3 py-4 md:py-3 md:min-w-[130px] rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${persona === p ? 'bg-blue-600 text-white shadow-lg scale-[1.03]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
                {PERSONAS[p].name}
              </button>
            ))}
          </div>
        </nav>

        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-300">
              <button onClick={() => setShowHelp(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">{t.install}</h3>
              <div className="space-y-8 text-left">
                <div className="flex gap-4">
                  <div className="bg-blue-500/10 p-3 rounded-2xl h-fit shrink-0"><Share size={20} className="text-blue-400" /></div>
                  <div>
                    <h4 className="font-bold text-slate-200 mb-1">Apple iOS</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">Klikni na <span className="text-white font-bold">Share</span> a vyber <span className="text-white font-bold">Add to Home Screen</span>.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-emerald-500/10 p-3 rounded-2xl h-fit shrink-0"><MoreVertical size={20} className="text-emerald-400" /></div>
                  <div>
                    <h4 className="font-bold text-slate-200 mb-1">Android</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">Klikni na <span className="text-white font-bold">tri bodky</span> a vyber <span className="text-white font-bold">Install</span>.</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowHelp(false)} className="w-full mt-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all">{t.understood}</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}