# 🌦️ Weather AI – Počasie s (pochybným) charakterom

**Prečo by mala byť predpoveď počasia nudná?** 
Zastavili sme sa v roku 2026 a zistili sme, že suché čísla nikoho nebavia. Tak sme zobrali najnovšiu **Gemmu 3 27B** a dali sme jej za úlohu komentovať to, čo sa deje vonku. Výsledok? Aplikácia, ktorá ti povie pravdu, aj keď bolí.

✨ **[Vyskúšaj naživo tu!](https://weather-alpha-woad.vercel.app/)**

---

## 🎭 Spoznaj svoje Weather Persony

V spodnom menu si môžeš prepínať medzi štyrmi "expertmi", ktorí vidia svet (a oblaky) úplne inak:

*   **🖕 Cynik:** Neznáša rána, neznáša ľudí a tvoje plány na víkend sú mu ukradnuté. Priprav sa na poriadnu dávku čierneho humoru.
*   **🛸 Konšpirátor:** HAARP, chemtrails a vládne experimenty. Ten dážď nie je voda, je to snaha o ovládnutie tvojej mysle! (Alobalovú čiapku si dokúp sám).
*   **💪 Tréner:** Žiadne výhovorky! Prší? Ideálny čas na angličáky v blate. Mrzne? Buduješ si charakter, ty padavka!
*   **🌈 Optimista:** *Toxicky* pozitívny človek. Aj keď vonku padajú traktory, on v tom vidí príležitosť na tancovanie v kalužiach a "osvieženie duše".

---

## 🛠️ Čo je pod kapotou? (Pre zvedavcov)

Žiadny over-engineering, len čistý a pragmatický kód:

*   **Next.js 16:** Srdce a pľúca aplikácie.
*   **Gemma 3 27B (via Google AI Studio):** Mozog, ktorý generuje tie šialené hlášky.
*   **Open-Meteo API:** Odkiaľ ťaháme tie reálne dáta (keď ich AI práve nefalšuje).
*   **Tailwind CSS:** Aby tie Bento boxy vyzerali luxusne aj na tvojom MacBooku.
*   **PWA:** Nainštaluj si to na plochu a tvár sa, že je to natívna appka.

---

## 🚀 Ako si to rozbehať u seba?

1.  Klonuj toto repo.
2.  Vytvor si `.env.local` a vlož tam svoj `GEMINI_API_KEY`.
3.  `npm install`
4.  `npm run dev`
5.  Priprav sa na to, že ti appka vynadá do "bledých tvárí".

---

**Postavené s láskou, kávou a miernym odporom k rannému vstávaniu. ☕️💻**