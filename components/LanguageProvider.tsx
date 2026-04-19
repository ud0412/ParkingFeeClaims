'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, LanguageCode, TranslationKey } from '@/lib/i18n';

interface LanguageContextType {
  locale: LanguageCode;
  setLocale: (lang: LanguageCode) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<LanguageCode>('ko');

  useEffect(() => {
    const saved = localStorage.getItem('app_locale') as LanguageCode;
    if (saved && translations[saved]) {
      setTimeout(() => setLocale(saved), 0);
    } else {
      const browserLang = navigator.language.slice(0, 2) as LanguageCode;
      if (translations[browserLang]) setTimeout(() => setLocale(browserLang), 0);
    }
  }, []);

  const handleSetLocale = (lang: LanguageCode) => {
    setLocale(lang);
    localStorage.setItem('app_locale', lang);
  };

  const t = (key: TranslationKey, params?: Record<string, string>): string => {
    let text: string = (translations[locale] as any)[key] || (translations['ko'] as any)[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
