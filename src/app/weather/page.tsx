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
  const tile = "rounded-[1.75rem] border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1";
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

  // Mini krivka denných teplôt (SVG sparkline) pre bento dlaždicu
  const curve = (() => {
    if (!weather) return null;
    const temps = weather.timeline.map((e) => e.temperature);
    const min = Math.min(...temps), max = Math.max(...temps), range = max - min || 1;
    const W = 260, H = 80, pad = 16;
    const pts = temps.map((tmp, i) => ({
      x: pad + (i * (W - 2 * pad)) / (temps.length - 1),
      y: pad + (1 - (tmp - min) / range) * (H - 2 * pad),
    }));
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${H} L ${pts[0].x.toFixed(1)} ${H} Z`;
    return { pts, line, area, W, H };
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

              {/* Pocitová teplota — teplý akcent */}
              <div className="rounded-[1.75rem] border border-amber-500/15 bg-gradient-to-br from-amber-500/10 to-orange-500/[0.03] p-4 md:p-5 flex flex-col justify-between min-h-[90px] transition-transform duration-300 hover:-translate-y-1">
                <ThermometerSnowflake size={18} className="text-amber-300/90" />
                <div>
                  <div className="text-2xl md:text-3xl font-black tabular-nums leading-none">{Math.round(weather.apparentTemperature)}°</div>
                  <div className={`${labelCls} mt-1.5`}>{t.feels}</div>
                </div>
              </div>

              {/* Vlhkosť — kruhový gauge, cyan akcent */}
              <div className="rounded-[1.75rem] border border-cyan-400/15 bg-gradient-to-br from-cyan-500/10 to-cyan-500/[0.03] p-4 md:p-5 flex items-center gap-3 min-h-[90px] transition-transform duration-300 hover:-translate-y-1">
                <div className="relative shrink-0">
                  <svg width="54" height="54" viewBox="0 0 64 64" className="-rotate-90">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#22d3ee" strokeWidth="7" strokeLinecap="round" strokeDasharray={2 * Math.PI * 26} strokeDashoffset={2 * Math.PI * 26 * (1 - weather.humidity / 100)} />
                  </svg>
                  <Droplets size={15} className="text-cyan-300 absolute inset-0 m-auto" />
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-black tabular-nums leading-none">{weather.humidity}%</div>
                  <div className={`${labelCls} mt-1.5`}>{t.humidity}</div>
                </div>
              </div>

              {/* Vietor — so škálou rýchlosti */}
              <div className={`${tile} p-4 md:p-5 flex flex-col justify-between min-h-[90px]`}>
                <Wind size={18} className="text-slate-300/80" />
                <div>
                  <div className="text-2xl md:text-3xl font-black tabular-nums leading-none">{Math.round(weather.windSpeed)}<span className="text-sm font-bold text-slate-500"> km/h</span></div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-slate-400 to-blue-400" style={{ width: `${Math.min(100, (weather.windSpeed / 60) * 100)}%` }}></div>
                  </div>
                  <div className={`${labelCls} mt-1.5`}>{t.wind}</div>
                </div>
              </div>

              {/* Deň / noc + čas — indigo akcent */}
              <div className="rounded-[1.75rem] border border-indigo-400/15 bg-gradient-to-br from-indigo-500/10 to-indigo-500/[0.03] p-4 md:p-5 flex flex-col justify-between min-h-[90px] transition-transform duration-300 hover:-translate-y-1">
                {weather.isDay ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-300" />}
                <div>
                  <div className="text-2xl md:text-3xl font-black tabular-nums leading-none">{weather.time?.slice(11, 16)}</div>
                  <div className={`${labelCls} mt-1.5`}>{weather.isDay ? 'Deň' : 'Noc'}</div>
                </div>
              </div>

              {/* Dnešný priebeh — krivka teplôt (2 stĺpce) */}
              <div className={`${tile} col-span-2 p-4 md:p-5`}>
                <div className={`${labelCls} mb-2`}>Dnešný priebeh</div>
                {curve && (
                  <>
                    <svg viewBox={`0 0 ${curve.W} ${curve.H}`} className="w-full" preserveAspectRatio="none" style={{ height: '70px' }}>
                      <defs>
                        <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={curve.area} fill="url(#curveFill)" />
                      <path d={curve.line} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                      {curve.pts.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#0b1220" stroke="#7dd3fc" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                      ))}
                    </svg>
                    <div className="flex justify-between mt-1">
                      {dayParts.map(({ Icon, label, i, color }) => (
                        <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                          <Icon size={13} className={color} />
                          <div className="text-sm font-black tabular-nums leading-none">{Math.round(weather.timeline[i].temperature)}°</div>
                          <div className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Ďalšie dni (2 stĺpce) */}
              <div className={`${tile} col-span-2 p-4 md:p-5`}>
                <div className={`${labelCls} mb-3`}>Ďalšie dni</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t.tomorrow, day: weather.tomorrow },
                    { label: afterTomorrowLabel, day: weather.afterTomorrow },
                  ].map((d, i) => (
                    <div key={i} className="rounded-2xl bg-white/[0.03] p-3 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">{d.label}</div>
                        <div className="text-xl md:text-2xl font-black tabular-nums leading-none">{Math.round(d.day.maxTemp)}°<span className="text-xs font-bold text-slate-500 ml-1">{Math.round(d.day.minTemp)}°</span></div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-1.5">{getWeatherIcon(d.day.weatherCode, true, "w-6 h-6")}</div>
                    </div>
                  ))}
                </div>
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
