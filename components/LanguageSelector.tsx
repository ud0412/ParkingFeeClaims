'use client';
import { useLanguage } from '@/components/LanguageProvider';
import { Globe } from 'lucide-react';
import { useState } from 'react';

const languages = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'es', label: 'Español' },
];

export function LanguageSelector() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-sm text-slate-700 shadow-sm"
      >
        <Globe size={16} className="text-slate-500" />
        <span className="font-medium">{languages.find(l => l.code === locale)?.label}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
            {languages.map(lang => (
              <button
                key={lang.code}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  locale === lang.code ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'
                }`}
                onClick={() => {
                  setLocale(lang.code as any);
                  setOpen(false);
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
