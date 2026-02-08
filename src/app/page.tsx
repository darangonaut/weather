'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sun, CloudLightning, ShieldAlert, Sparkles, ArrowRight, User, Smartphone, Globe, MessageSquareQuote } from 'lucide-react';
import { translations } from '@/lib/translations';

export default function LandingPage() {
  const [currentLang, setCurrentLang] = useState<'sk' | 'en' | 'cs' | 'de' | 'es' | 'fr'>('sk');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang') as any;
    const browserLang = navigator.language.split('-')[0] as any;
    
    const finalLang = translations[langParam as keyof typeof translations] 
      ? langParam 
      : (translations[browserLang as keyof typeof translations] ? browserLang : 'en');
      
    setCurrentLang(finalLang);
  }, []);

  const t = translations[currentLang] || translations.en;

  const languages = [
    { code: 'sk', flag: '🇸🇰' },
    { code: 'cs', flag: '🇨🇿' },
    { code: 'en', flag: '🇬🇧' },
    { code: 'de', flag: '🇩🇪' },
    { code: 'es', flag: '🇪🇸' },
    { code: 'fr', flag: '🇫🇷' },
  ];

  const changeLang = (code: any) => {
    setCurrentLang(code);
    window.history.pushState({}, '', `?lang=${code}`);
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* Glow Backgrounds */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-24">
        
        {/* Navigation */}
        <nav className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16 md:mb-32">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sun className="text-white" size={24} />
            </div>
            <span className="text-xl font-black italic tracking-tighter uppercase">Weather AI</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-full border border-white/10">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLang(lang.code)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                    currentLang === lang.code ? 'bg-white/20 scale-110 shadow-lg' : 'hover:bg-white/10 opacity-50 hover:opacity-100'
                  }`}
                  title={lang.code.toUpperCase()}
                >
                  <span className="text-lg leading-none">{lang.flag}</span>
                </button>
              ))}
            </div>
            
            <Link href={`/weather?lang=${currentLang}`} className="px-6 py-2.5 bg-white text-black hover:bg-slate-200 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest transition-all">
              {t.open_app}
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="text-center space-y-8 mb-32">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-bottom-2 duration-700">
            <Sparkles size={12} />
            Gemma 3 27B
          </div>
          
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase italic max-w-4xl mx-auto">
            {t.hero_title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">{t.hero_accent}</span>
          </h2>
          
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            {t.hero_desc}
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
            <Link href={`/weather?lang=${currentLang}`} className="group px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-sm tracking-widest transition-all shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-3">
              {t.cta_primary}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })} className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black uppercase text-sm tracking-widest transition-all">
              {t.cta_secondary}
            </button>
          </div>
        </section>

        {/* Character Showcase */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
          {[
            { name: t.char_cynic, icon: <User className="text-slate-400" />, desc: t.char_cynic_desc, color: 'bg-slate-900/50' },
            { name: t.char_theory, icon: <ShieldAlert className="text-orange-400" />, desc: t.char_theory_desc, color: 'bg-orange-500/5 border-orange-500/10' },
            { name: t.char_coach, icon: <CloudLightning className="text-blue-400" />, desc: t.char_coach_desc, color: 'bg-blue-500/5 border-blue-500/10' },
            { name: t.char_optimist, icon: <Sparkles className="text-yellow-400" />, desc: t.char_optimist_desc, color: 'bg-yellow-500/5 border-yellow-500/10' }
          ].map((char, i) => (
            <div key={i} className={`${char.color} border border-white/5 p-8 rounded-[2rem] space-y-4 hover:scale-[1.02] transition-all`}>
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">{char.icon}</div>
              <h3 className="text-2xl font-black uppercase tracking-tighter italic">{char.name}</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">{char.desc}</p>
            </div>
          ))}
        </section>

        {/* Features Bento */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
          <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-800 p-10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="relative z-10">
              <Globe className="mb-6 opacity-50" size={40} />
              <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 italic">{t.feature_i18n_title}</h3>
              <p className="text-blue-100 font-medium max-w-sm">{t.feature_i18n_desc}</p>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:rotate-12 transition-transform">
              <Globe size={300} />
            </div>
          </div>
          
          <div className="bg-slate-900 border border-white/5 p-10 rounded-[2.5rem] flex flex-col justify-between">
            <Smartphone className="opacity-50" size={40} />
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">{t.feature_pwa_title}</h3>
              <p className="text-sm text-slate-400 font-medium">{t.feature_pwa_desc}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-white/5 p-10 rounded-[2.5rem] md:col-span-3 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-4">
              <MessageSquareQuote className="opacity-50 mx-auto md:mx-0" size={40} />
              <h3 className="text-3xl font-black uppercase tracking-tighter italic">{t.testimonial}</h3>
              <p className="text-slate-400 font-medium">{t.testimonial_author}</p>
            </div>
            <Link href={`/weather?lang=${currentLang}`} className="w-full md:w-auto px-12 py-6 bg-white text-black rounded-[2rem] font-black uppercase text-sm tracking-widest hover:scale-105 transition-all text-center">
              {t.try_now}
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-16 border-t border-white/5 text-slate-600">
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">© 2026 Weather AI • {t.footer_built_by} @darangonaut</p>
        </footer>

      </div>
    </main>
  );
}