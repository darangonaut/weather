// Client-safe persona metadata. Vyčlenené z lib/gemini.ts, aby sa do klientského
// bundlu (static export) neťahal Gemini SDK ani server-side logika.

export type Persona = 'cynic' | 'theory' | 'coach' | 'optimist';

export const PERSONAS: Record<Persona, { name: string }> = {
  cynic: { name: 'Cynik' },
  theory: { name: 'Konšpirátor' },
  coach: { name: 'Tréner' },
  optimist: { name: 'Optimista' },
};
