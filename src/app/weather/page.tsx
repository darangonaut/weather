'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sun, Moon, Cloud, CloudRain, CloudLightning, CloudSnow, User, RefreshCw, AlertCircle, MapPin, Loader2, Wind, Droplets, ThermometerSnowflake, Sunrise, Sunset, HelpCircle, X, Share, Shirt, MoreVertical } from 'lucide-react';
import { Persona, PERSONAS } from '@/lib/personas';
import { calculateDistance } from '@/lib/utils';
import { translations } from '@/lib/translations';
import { toPng } from 'html-to-image';

// Version: 2.0.0-bento
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

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona>('cynic');
  const [showHelp, setShowHelp] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [currentLang, setCurrentLang] = useState<'sk' | 'en' | 'cs' | 'de' | 'es' | 'fr'>('sk');

  const captureRef = useRef<HTMLDivElement>(null);
  const t = translations[currentLang as keyof typeof translations] || translations.en;

  const handleShare = async () => {
    if (!captureRef.current || isSharing) return;
    setIsSharing(true);

    try {
      // 1. Vygenerovanie PNG (optimalizované pre stabilitu)
      const dataUrl = await toPng(captureRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#020617',
        filter: (node: any) => {
          if (node.classList?.contains('no-export')) return false;
          if (['BUTTON', 'NAV'].includes(node.tagName)) return false;
          return true;
        }
      });

      // 2. Prevod na súbor (File Object)
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `weather-${weather?.locationName}.png`, { type: 'image/png' });

      // 3. Pokus o natívne zdieľanie súboru
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Weather AI',
          text: `My weather report from ${weather?.locationName}`
        });
      } else {
        // Fallback: Klasické stiahnutie
        const link = document.createElement('a');
        link.download = `weather-ai.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Share failed:', err);
      // Posledný fallback - aspoň textové zdieľanie
      if (navigator.share && weather?.commentaries) {
        await navigator.share({
          title: 'Weather AI',
          text: `"${weather.commentaries[persona]?.text}"\n\n${window.location.href}`
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  const fetchWeather = useCallback(async (lat: number, lon: number, forcePersona?: Persona) => {
    // Ak už máme dáta pre veľmi blízku polohu (menej ako 2km), ignorujeme aktualizáciu na pozadí, aby sme predišli blikaniu
    if (weather && !forcePersona && calculateDistance(lat, lon, Number(localStorage.getItem('last_lat') || 0), Number(localStorage.getItem('last_lon') || 0)) < 2) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const lang = (urlParams.get('lang') || navigator.language.split('-')[0]) as any;
    const finalLang = translations[lang as keyof typeof translations] ? lang : 'en';
    setCurrentLang(finalLang);

    const cached = localStorage.getItem('weather_cache_v47');
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

      // Pri aktualizácii na pozadí zachováme staré komentáre, kým sa nenačítajú nové, aby to neprebliklo na skeleton
      setWeather(prev => prev ? { ...weatherData, commentaries: prev.commentaries } : weatherData);
      setLoading(false);

      // Uložíme aktuálne súradnice pre budúce porovnanie vzdialenosti
      localStorage.setItem('last_lat', lat.toString());
      localStorage.setItem('last_lon', lon.toString());

      const aiRes = await fetch('/api/commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: finalLang, weatherData })
      });
      const aiData = await aiRes.json();
      if (aiData.commentaries) {
        const fullData = { ...weatherData, commentaries: aiData.commentaries };
        setWeather(fullData);
        localStorage.setItem('weather_cache_v47', JSON.stringify({ lat, lon, timestamp: Date.now(), data: fullData }));
      }
    } catch (err: any) {
      setError(err.message || (translations[finalLang as keyof typeof translations] || translations.en).weather_error);
    } finally {
      setLoading(false);
    }
  }, [weather]);

  const updateLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        localStorage.setItem('last_location_v1', JSON.stringify({ lat, lon }));
        fetchWeather(lat, lon);
      },
      () => {
        setError(t.geo_error);
        setLoading(false);
      },
      { timeout: 8000 }
    );
  }, [fetchWeather, t.geo_error]);

  useEffect(() => {
    const savedPersona = localStorage.getItem('last_persona') as Persona;
    if (savedPersona && PERSONAS[savedPersona]) setPersona(savedPersona);

    // Načítame z cache pre okamžitý UI feedback
    const savedLocation = localStorage.getItem('last_location_v1');
    if (savedLocation) {
      const { lat, lon } = JSON.parse(savedLocation);
      fetchWeather(lat, lon);
    }

    // Vždy skúsime získať čerstvú polohu na pozadí (ak sa používateľ presunul)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        localStorage.setItem('last_location_v1', JSON.stringify({ lat, lon }));
        fetchWeather(lat, lon);
      },
      (err) => {
        // Ak nemáme nič v cache a GPS zlyhá, ukážeme chybu
        if (!savedLocation) {
          setError(t.geo_error);
          setLoading(false);
        }
        console.warn('Background geolocation failed:', err);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, [fetchWeather, t.geo_error]);

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

  // Spoločné triedy bento dlaždice
  const tile = "rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm";
  const labelCls = "text-[9px] uppercase tracking-widest text-slate-500 font-bold";

  const dayParts = weather ? [
    { Icon: Sunrise, label: t.morning, i: 0, color: 'text-orange-300' },
    { Icon: Sun, label: t.noon, i: 1, color: 'text-yellow-300' },
    { Icon: Sunset, label: t.evening, i: 2, color: 'text-indigo-300' },
  ] : [];

  const afterTomorrowLabel = (() => {
    const d = new Date(Date.now() + 172800000).toLocaleDateString(currentLang, { weekday: 'short' });
    return d.charAt(0).toUpperCase() + d.slice(1);
  })();

  return (
    <main className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-blue-500/30 pb-28 md:pb-12">
      {/* Ambientné svetlo na pozadí */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] left-[15%] w-[55%] h-[45%] bg-blue-600/10 blur-[130px] rounded-full"></div>
        <div className="absolute bottom-[5%] right-[8%] w-[40%] h-[40%] bg-indigo-600/10 blur-[130px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-3 md:p-6">

        {/* Hlavička */}
        <header className="flex justify-between items-center mb-4 px-1 pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#020617] rounded-xl flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
              <img src="/icon-192x192.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-black italic tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">Weather AI</span>
          </div>
          <div className="flex gap-2 no-export">
            {weather && (
              <button onClick={handleShare} disabled={isSharing} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors group disabled:opacity-50" title={t.share}>
                {isSharing ? <Loader2 size={18} className="animate-spin text-blue-400" /> : <Share size={18} className="text-slate-400 group-hover:text-blue-400" />}
              </button>
            )}
            <button onClick={updateLocation} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors group" title="Obnoviť">
              <RefreshCw size={18} className={`text-slate-400 group-hover:text-blue-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowHelp(true)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors group" title="Pomoc">
              <HelpCircle size={18} className="text-slate-400 group-hover:text-blue-400" />
            </button>
          </div>
        </header>

        {loading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
            <Loader2 size={40} className="text-blue-400 animate-spin opacity-50" />
            <p className="text-sm font-medium text-slate-400 italic">{t.loading}</p>
          </div>
        ) : error ? (
          <div className={`${tile} min-h-[40vh] flex flex-col items-center justify-center p-8 text-center !bg-red-500/5 !border-red-500/10`}>
            <AlertCircle className="w-10 h-10 text-red-500/50 mb-4" />
            <p className="text-red-200/70 text-sm mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-colors">{t.understood}</button>
          </div>
        ) : weather ? (
          <div ref={captureRef} className="bg-[#020617] rounded-[2rem]">
            {/* === BENTO MRIEŽKA === */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-in fade-in duration-700">

              {/* HERO — aktuálna teplota (2×2) */}
              <div className="col-span-2 md:row-span-2 rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-600 to-indigo-800 p-6 relative overflow-hidden flex flex-col justify-between min-h-[200px] md:min-h-[260px]">
                <div className="absolute -right-10 -top-10 opacity-[0.12] rotate-12 pointer-events-none">
                  {getWeatherIcon(weather.weatherCode, weather.isDay, "w-64 h-64")}
                </div>
                <div className="relative flex items-center gap-1.5 text-blue-100 font-semibold text-sm md:text-base">
                  <MapPin size={16} className="shrink-0" />
                  <span className="truncate">{weather.locationName}</span>
                </div>
                <div className="relative">
                  <div className="text-7xl md:text-9xl font-black tracking-tighter leading-none drop-shadow-lg">{Math.round(weather.temperature)}°</div>
                  <div className="inline-block mt-3 bg-white/15 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-[10px] md:text-xs font-bold uppercase tracking-widest">{weather.description}</div>
                </div>
              </div>

              {/* Pocitová teplota */}
              <div className={`${tile} p-4 md:p-5 flex flex-col justify-between min-h-[90px]`}>
                <ThermometerSnowflake size={18} className="text-blue-300/80" />
                <div>
                  <div className="text-2xl md:text-3xl font-black tabular-nums leading-none">{Math.round(weather.apparentTemperature)}°</div>
                  <div className={`${labelCls} mt-1.5`}>{t.feels}</div>
                </div>
              </div>

              {/* Vlhkosť */}
              <div className={`${tile} p-4 md:p-5 flex flex-col justify-between min-h-[90px]`}>
                <Droplets size={18} className="text-cyan-300/80" />
                <div>
                  <div className="text-2xl md:text-3xl font-black tabular-nums leading-none">{weather.humidity}%</div>
                  <div className={`${labelCls} mt-1.5`}>{t.humidity}</div>
                </div>
              </div>

              {/* Vietor */}
              <div className={`${tile} p-4 md:p-5 flex flex-col justify-between min-h-[90px]`}>
                <Wind size={18} className="text-slate-300/80" />
                <div>
                  <div className="text-2xl md:text-3xl font-black tabular-nums leading-none">{Math.round(weather.windSpeed)}<span className="text-sm font-bold text-slate-500"> km/h</span></div>
                  <div className={`${labelCls} mt-1.5`}>{t.wind}</div>
                </div>
              </div>

              {/* Deň / noc + čas */}
              <div className={`${tile} p-4 md:p-5 flex flex-col justify-between min-h-[90px]`}>
                {weather.isDay ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-300" />}
                <div>
                  <div className="text-2xl md:text-3xl font-black tabular-nums leading-none">{weather.time?.slice(11, 16)}</div>
                  <div className={`${labelCls} mt-1.5`}>{weather.isDay ? 'Deň' : 'Noc'}</div>
                </div>
              </div>

              {/* Dnešný priebeh (2 stĺpce) */}
              <div className={`${tile} col-span-2 p-4 md:p-5`}>
                <div className={`${labelCls} mb-3`}>Dnešný priebeh</div>
                <div className="flex justify-between gap-2">
                  {dayParts.map(({ Icon, label, i, color }) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.03] py-3">
                      <Icon size={16} className={color} />
                      <div className="text-lg md:text-xl font-black tabular-nums leading-none">{Math.round(weather.timeline[i].temperature)}°</div>
                      <div className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zajtra */}
              <div className={`${tile} p-4 md:p-5 flex flex-col justify-between min-h-[90px]`}>
                <div className="flex items-center justify-between">
                  <span className={labelCls}>{t.tomorrow}</span>
                  <div className="bg-white/5 rounded-xl p-1.5">{getWeatherIcon(weather.tomorrow.weatherCode, true, "w-5 h-5")}</div>
                </div>
                <div className="text-2xl md:text-3xl font-black tabular-nums leading-none">{Math.round(weather.tomorrow.maxTemp)}°</div>
              </div>

              {/* Pozajtra */}
              <div className={`${tile} p-4 md:p-5 flex flex-col justify-between min-h-[90px]`}>
                <div className="flex items-center justify-between">
                  <span className={labelCls}>{afterTomorrowLabel}</span>
                  <div className="bg-white/5 rounded-xl p-1.5">{getWeatherIcon(weather.afterTomorrow.weatherCode, true, "w-5 h-5")}</div>
                </div>
                <div className="text-2xl md:text-3xl font-black tabular-nums leading-none">{Math.round(weather.afterTomorrow.maxTemp)}°</div>
              </div>

              {/* AI komentár (celá šírka) */}
              <section className="col-span-2 md:col-span-4 rounded-[2rem] border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 md:p-8 relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 opacity-[0.03] pointer-events-none"><User size={220} /></div>
                <div className="relative">
                  {!weather.commentaries ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-3 bg-slate-700/50 rounded-full w-full"></div>
                      <div className="h-3 bg-slate-700/50 rounded-full w-5/6"></div>
                      <div className="h-3 bg-slate-700/50 rounded-full w-2/3"></div>
                    </div>
                  ) : (
                    <p className="text-lg md:text-2xl font-medium leading-relaxed text-slate-200 italic">&quot;{weather.commentaries[persona]?.text.trim()}&quot;</p>
                  )}
                  {weather.commentaries && (
                    <div className="mt-6 flex items-center gap-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                      <div className="bg-blue-500/20 p-3 rounded-2xl shrink-0"><Shirt size={20} className="text-blue-400" /></div>
                      <div className="text-left">
                        <span className="text-[8px] font-black uppercase tracking-widest text-blue-400 block mb-1">{t.outfit}</span>
                        <p className="text-sm text-slate-200 font-medium">{weather.commentaries[persona]?.outfit}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

            </div>
          </div>
        ) : null}

        {/* Výber osobnosti */}
        {weather && !error && (
          <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-lg bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-1.5 shadow-2xl z-50 md:relative md:bottom-0 md:left-0 md:translate-x-0 md:max-w-none md:mt-4 md:bg-white/[0.03] md:shadow-none no-export">
            <div className="flex items-center justify-between gap-1.5 md:justify-center md:gap-3">
              {(Object.keys(PERSONAS) as Persona[]).map((p) => (
                <button key={p} onClick={() => handlePersonaChange(p)} className={`flex-1 md:flex-none px-3 py-4 md:py-3 md:min-w-[130px] rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${persona === p ? 'bg-blue-600 text-white shadow-lg scale-[1.03]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
                  {PERSONAS[p].name}
                </button>
              ))}
            </div>
          </nav>
        )}

        {/* Modálne okno s pomocou */}
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
