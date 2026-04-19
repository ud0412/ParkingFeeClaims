'use client';
import { useEffect, useState } from 'react';
import { Clock, CheckCircle, History } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

interface Claim {
  id: string;
  parkingName: string;
  fee: number;
  entryTime: string;
  exitTime: string;
  status: string;
  imageUrl: string;
  createdAt: string;
}

export default function HistoryPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetch('/api/claims')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClaims(data);
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-10">{t('loading')}</div>;

  return (
    <div className="space-y-6 flex-1 flex flex-col">
      <header className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-slate-800">{t('myHistory')}</h1>
      </header>
      
      {claims.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
           <History size={48} className="mb-4 text-slate-300" />
           <p className="font-medium">{t('noHistory')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {claims.map(claim => (
            <div key={claim.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-xs font-semibold px-3 py-1 rounded-md bg-slate-100 text-slate-600">
                   {new Date(claim.createdAt).toLocaleDateString()}
                 </span>
                 {claim.status !== 'pending' && (
                   <span className="flex items-center text-xs font-semibold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md border border-emerald-100">
                     <CheckCircle size={12} className="mr-1" /> {t('completed')}
                   </span>
                 )}
               </div>
               
               <h3 className="text-lg font-bold text-slate-800 mb-1">{claim.parkingName}</h3>
               <p className="text-2xl font-bold text-blue-600 mb-6">{claim.fee.toLocaleString()} {t('currency')}</p>
               
               <div className="space-y-2 text-[0.85rem] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-4 mb-6">
                 <div className="flex justify-between">
                   <span className="font-medium text-slate-400">{t('entry')}</span>
                   <span className="font-medium">{claim.entryTime}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="font-medium text-slate-400">{t('exit')}</span>
                   <span className="font-medium">{claim.exitTime}</span>
                 </div>
               </div>

               <a 
                 href={claim.imageUrl} 
                 target="_blank" 
                 rel="noreferrer"
                 className="mt-auto block w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-center rounded-lg text-sm font-semibold transition-colors"
               >
                 {t('viewReceipt')}
               </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
