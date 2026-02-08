export const translations = {
  sk: {
    feels: "Pocit", humidity: "Vlhkosť", wind: "Vietor", morning: "Ráno", noon: "Obed", evening: "Večer",
    current: "Aktuálne", tomorrow: "Zajtra", outfit: "Odporúčaný outfit", share: "Share", install: "Inštalácia",
    understood: "Rozumiem", loading: "Lúštim reč mrakov...", geo_error: "Povoľte GPS v nastaveniach.", weather_error: "Chyba spojenia"
  },
  cs: {
    feels: "Pocit", humidity: "Vlhkost", wind: "Vítr", morning: "Ráno", noon: "Oběd", evening: "Večer",
    current: "Aktuálně", tomorrow: "Zítra", outfit: "Doporučený outfit", share: "Share", install: "Instalace",
    understood: "Rozumím", loading: "Luštím řeč mraků...", geo_error: "Povolte GPS v nastavení.", weather_error: "Chyba spojení"
  },
  en: {
    feels: "Feels", humidity: "Humidity", wind: "Wind", morning: "Morning", noon: "Noon", evening: "Evening",
    current: "Current", tomorrow: "Tomorrow", outfit: "Recommended outfit", share: "Share", install: "Installation",
    understood: "Got it", loading: "Decoding clouds...", geo_error: "Please enable GPS.", weather_error: "Connection error"
  },
  de: {
    feels: "Gefühlt", humidity: "Feuchtigkeit", wind: "Wind", morning: "Morgen", noon: "Mittag", evening: "Abend",
    current: "Aktuell", tomorrow: "Morgen", outfit: "Empfohlenes Outfit", share: "Teilen", install: "Installation",
    understood: "Verstanden", loading: "Wolken entschlüsseln...", geo_error: "Bitte GPS aktivieren.", weather_error: "Verbindungsfehler"
  },
  es: {
    feels: "Sensación", humidity: "Humedad", wind: "Viento", morning: "Mañana", noon: "Mediodía", evening: "Noche",
    current: "Actual", tomorrow: "Mañana", outfit: "Outfit recomendado", share: "Compartir", install: "Instalación",
    understood: "Entendido", loading: "Descifrando nubes...", geo_error: "Por favor activa el GPS.", weather_error: "Error de conexión"
  },
  fr: {
    feels: "Ressenti", humidity: "Humidité", wind: "Vent", morning: "Matin", noon: "Midi", evening: "Soir",
    current: "Actuel", tomorrow: "Demain", outfit: "Tenue recommandée", share: "Partager", install: "Installation",
    understood: "Compris", loading: "Décryptage des nuages...", geo_error: "Veuillez activer le GPS.", weather_error: "Erreur de connexion"
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;