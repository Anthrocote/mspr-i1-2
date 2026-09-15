'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');

  // Read the persisted preference after mount, not via a lazy initializer:
  // localStorage is unavailable during SSR, and applying it at init would
  // desync the server HTML (always 'fr') from the client and warn on hydration.
  useEffect(() => {
    const saved = localStorage.getItem('app-language') as Language;
    if (saved && (saved === 'fr' || saved === 'en' || saved === 'es')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deferred one-time sync from persisted storage
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: string): string => {
    // Object.hasOwn guards against inherited members ('constructor', 'toString'…)
    // being returned as if they were translations.
    const dict = translations[language] ?? translations.fr;
    if (Object.hasOwn(dict, key)) return dict[key];
    if (Object.hasOwn(translations.fr, key)) return translations.fr[key];
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
