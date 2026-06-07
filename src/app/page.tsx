'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sun, CloudLightning, ShieldAlert, Sparkles, ArrowRight, User, Smartphone, Globe, MessageSquareQuote, ChevronDown } from 'lucide-react';
import { translations } from '@/lib/translations';

export default function LandingPage() {
  const [currentLang, setCurrentLang] = useState<'sk' | 'en' | 'cs' | 'de' | 'es' | 'fr'>('sk');
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // PWA používateľov presmerujeme rovno do aplikácie
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      window.location.href = `/weather${window.location.search}`;
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang') as any;
    const browserLang = navigator.language.split('-')[0] as any;
    const finalLang = translations[langParam as keyof typeof translations]
      ? langParam
      : (translations[browserLang as keyof typeof translations] ? browserLang : 'en');
    setCurrentLang(finalLang);

    // Scroll-triggered reveals
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in-view'); }),
      { threshold: 0.15 }
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

    // Scroll progress bar
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? h.scrollTop / max : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);

  const t = translations[currentLang] || translations.en;

  const languages = [
    { code: 'sk', flag: '🇸🇰' }, { code: 'cs', flag: '🇨🇿' }, { code: 'en', flag: '🇬🇧' },
    { code: 'de', flag: '🇩🇪' }, { code: 'es', flag: '🇪🇸' }, { code: 'fr', flag: '🇫🇷' },
  ];

  const changeLang = (code: any) => {
    setCurrentLang(code);
    window.history.pushState({}, '', `?lang=${code}`);
  };

  const characters = [
    { name: t.char_cynic, icon: <User className="text-slate-300" size={26} />, desc: t.char_cynic_desc, ring: 'hover:border-slate-400/40' },
    { name: t.char_theory, icon: <ShieldAlert className="text-orange-400" size={26} />, desc: t.char_theory_desc, ring: 'hover:border-orange-400/40' },
    { name: t.char_coach, icon: <CloudLightning className="text-blue-400" size={26} />, desc: t.char_coach_desc, ring: 'hover:border-blue-400/40' },
    { name: t.char_optimist, icon: <Sparkles className="text-yellow-400" size={26} />, desc: t.char_optimist_desc, ring: 'hover:border-yellow-400/40' },
  ];

  // Kinetic headline — slová sa animujú postupne
  const titleWords = t.hero_title.split(' ');
  const accentWords = t.hero_accent.split(' ');

  return (
    <main className="bg-[#020617] text-slate-50 font-sans selection:bg-blue-500/30 overflow-x-hidden">

      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[60] bg-transparent">
        <div ref={progressRef} className="scroll-progress h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"></div>
      </div>

      {/* Glow pozadie */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] bg-blue-600/10 blur-[130px] rounded-full"></div>
        <div className="absolute top-[40%] -right-[10%] w-[35%] h-[35%] bg-purple-600/10 blur-[130px] rounded-full"></div>
      </div>

      {/* Fixná navigácia */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#020617]/60 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#020617] rounded-xl flex items-center justify-center border border-white/10 overflow-hidden">
              <img src="/icon-192x192.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-base font-black italic tracking-tighter uppercase">Weather AI</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex bg-white/5 p-1 rounded-full border border-white/10">
              {languages.map((lang) => (
                <button key={lang.code} onClick={() => changeLang(lang.code)} title={lang.code.toUpperCase()}
                  className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${currentLang === lang.code ? 'bg-white/20 scale-110' : 'opacity-50 hover:opacity-100'}`}>
                  <span className="text-base leading-none">{lang.flag}</span>
                </button>
              ))}
            </div>
            <Link href={`/weather?lang=${currentLang}`} className="px-5 py-2 bg-white text-black hover:bg-slate-200 rounded-full text-[11px] font-black uppercase tracking-widest transition-all">
              {t.open_app}
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10">

        {/* HERO — kinetic typografia */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10 kinetic-word" style={{ animationDelay: '0.05s' }}>
            <Sparkles size={12} /> Gemini 2.5 Flash
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.92] uppercase italic">
            {titleWords.map((w, i) => (
              <span key={`t-${i}`} className="kinetic-mask">
                <span className="kinetic-word" style={{ animationDelay: `${0.15 + i * 0.08}s` }}>{w}&nbsp;</span>
              </span>
            ))}
            <br />
            {accentWords.map((w, i) => (
              <span key={`a-${i}`} className="kinetic-mask">
                <span className="kinetic-word text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500" style={{ animationDelay: `${0.15 + (titleWords.length + i) * 0.08}s` }}>{w}&nbsp;</span>
              </span>
            ))}
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed mt-8 kinetic-word" style={{ animationDelay: '0.7s' }}>
            {t.hero_desc}
          </p>

          <div className="kinetic-word mt-10" style={{ animationDelay: '0.85s' }}>
            <Link href={`/weather?lang=${currentLang}`} className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-sm tracking-widest transition-all shadow-2xl shadow-blue-600/30">
              {t.cta_primary}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600">
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">{t.cta_secondary}</span>
            <ChevronDown className="scroll-ind" size={20} />
          </div>
        </section>

        {/* POSTAVY — staggered reveal */}
        <section className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <h2 className="reveal text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-3 text-center">
            4 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">osobnosti</span>
          </h2>
          <p className="reveal reveal-d1 text-slate-500 text-center max-w-xl mx-auto mb-16 font-medium">{t.cta_secondary} — {t.testimonial}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {characters.map((char, i) => (
              <div key={i} className={`reveal reveal-d${i + 1} bg-white/[0.03] border border-white/10 ${char.ring} p-7 rounded-[2rem] space-y-4 transition-all hover:-translate-y-1`}>
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center">{char.icon}</div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">{char.name}</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">{char.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES — reveal bento */}
        <section className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="reveal md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-800 p-10 rounded-[2.5rem] relative overflow-hidden group min-h-[240px] flex flex-col justify-end">
              <div className="absolute -right-10 -top-10 opacity-10 group-hover:rotate-12 transition-transform duration-700"><Globe size={300} /></div>
              <Globe className="mb-6 opacity-60" size={40} />
              <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-3 italic relative">{t.feature_i18n_title}</h3>
              <p className="text-blue-100 font-medium max-w-sm relative">{t.feature_i18n_desc}</p>
            </div>

            <div className="reveal reveal-d1 bg-white/[0.03] border border-white/10 p-10 rounded-[2.5rem] flex flex-col justify-between min-h-[240px]">
              <Smartphone className="opacity-60" size={40} />
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">{t.feature_pwa_title}</h3>
                <p className="text-sm text-slate-400 font-medium">{t.feature_pwa_desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIAL — veľká kinetic veta */}
        <section className="max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
          <MessageSquareQuote className="reveal mx-auto text-blue-500/40 mb-8" size={48} />
          <blockquote className="reveal reveal-d1 text-3xl md:text-5xl font-black tracking-tighter italic leading-tight">
            {t.testimonial}
          </blockquote>
          <p className="reveal reveal-d2 text-slate-500 font-medium mt-6">{t.testimonial_author}</p>
        </section>

        {/* FINÁLNE CTA */}
        <section className="max-w-4xl mx-auto px-6 pb-32">
          <div className="reveal bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent pointer-events-none"></div>
            <h2 className="relative text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-8">{t.try_now}</h2>
            <Link href={`/weather?lang=${currentLang}`} className="relative group inline-flex items-center justify-center gap-3 px-12 py-6 bg-white text-black rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-105 transition-all">
              {t.cta_primary}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
          </div>

          <footer className="text-center pt-16 text-slate-600">
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">© 2026 Weather AI • {t.footer_built_by} @darangonaut</p>
          </footer>
        </section>

      </div>
    </main>
  );
}
