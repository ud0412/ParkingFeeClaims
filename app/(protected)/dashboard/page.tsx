'use client';
import { useEffect, useState } from 'react';
import { Receipt, History, UserCircle, CarFront, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

interface User {
  name: string;
  email: string;
  accountInfo: string;
  role?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetch('/api/user')
      .then(r => r.json())
      .then(d => {
        if(!d.error) setUser(d);
      });
  }, []);

  if (!user) return <div className="text-center py-10">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-slate-800">{t('dashboard')}</h1>
      </header>

      <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">
            {t('welcomeName', { name: user.name })}
          </h2>
          <p className="text-slate-500 text-sm">{t('driveSafely')}</p>
        </div>
        <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600">
           <CarFront size={28} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/claim" className="bg-blue-600 hover:bg-blue-700 transition-colors p-6 rounded-xl text-white flex items-center justify-between group shadow-sm">
          <div>
            <h3 className="text-lg font-bold mb-1">{t('newClaim')}</h3>
            <p className="text-blue-100 text-sm">{t('newClaimDesc')}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Receipt />
          </div>
        </Link>
        <Link href="/history" className="bg-white border border-slate-200 hover:bg-slate-50 transition-colors p-6 rounded-xl text-slate-800 flex items-center justify-between group shadow-sm">
          <div>
            <h3 className="text-lg font-bold mb-1">{t('viewHistory')}</h3>
            <p className="text-slate-500 text-sm">{t('viewHistoryDesc')}</p>
          </div>
          <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <History />
          </div>
        </Link>
        <Link href="/profile" className="bg-white border border-slate-200 hover:bg-slate-50 transition-colors p-6 rounded-xl text-slate-800 flex items-center justify-between group shadow-sm">
          <div>
            <h3 className="text-lg font-bold mb-1">{t('profileMgmt')}</h3>
            <p className="text-slate-500 text-sm">{t('profileMgmtDesc')}</p>
          </div>
          <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserCircle />
          </div>
        </Link>
        {user.role === 'admin' && (
          <Link href="/admin" className="md:col-span-2 bg-slate-800 hover:bg-slate-900 transition-colors p-6 rounded-xl text-white flex items-center justify-between group shadow-sm">
            <div>
              <h3 className="text-lg font-bold mb-1">{t('adminMenu')}</h3>
              <p className="text-slate-300 text-sm">{t('adminMenuDesc')}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldAlert />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
