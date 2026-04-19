'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Users, FileText, UserCog, Trash2, KeyRound, ShieldAlert, Car, Edit2, Check, X, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/LanguageProvider';

interface AdminClaim {
  id: string;
  userName: string;
  accountInfo: string;
  entryTime: string;
  exitTime: string;
  imageUrl: string;
  fee: number;
  parkingName: string;
  createdAt: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'claims' | 'users' | 'parking-lots'>('claims');
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [parkingLots, setParkingLots] = useState<any[]>([]);
  const [csvData, setCsvData] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<AdminClaim | null>(null);

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');

  const router = useRouter();
  const { t } = useLanguage();

  const [myRole, setMyRole] = useState<string>('');

  const fetchClaims = async () => {
    let url = '/api/admin/claims';
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    if (res.status === 401 || res.status === 403) {
      router.push('/dashboard');
      return;
    }
    const data = await res.json();
    if (data && !data.error) {
      setClaims(data.list);
      setCsvData(data.csvData);

      // Initialize dates if not set yet
      if (!startDate && data.weekStart) {
        setStartDate(data.weekStart.split('T')[0]);
      }
      if (!endDate && data.weekEnd) {
        setEndDate(data.weekEnd.split('T')[0]);
      }
    }
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    if (res.status === 401 || res.status === 403) return;
    const data = await res.json();
    if (data && data.users) {
      setUsers(data.users);
    }
  };

  const fetchParkingLots = async () => {
    const res = await fetch('/api/admin/parking-lots');
    if (res.status === 401 || res.status === 403) return;
    const data = await res.json();
    if (data && data.list) {
      setParkingLots(data.list);
    }
  };

  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(d => {
      setMyRole(d.role || '');
    });
    fetchClaims().then(() => fetchUsers()).then(() => fetchParkingLots()).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, startDate, endDate]);

  const handleDownload = () => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `주차비_청구내역_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm(t('confirmDeleteUser'))) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert(t('userDeleted'));
      fetchUsers();
      fetchClaims(); // refresh claims if related claims were removed
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleChangeRole = async (id: string, currentRole: string) => {
    const nextRoleMap: Record<string, string> = {
      'user': 'manager',
      'manager': 'admin',
      'admin': 'user'
    };
    const newRole = nextRoleMap[currentRole] || 'user';
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'changeRole', role: newRole })
    });
    if (res.ok) {
      alert(t('roleChangeSuccess'));
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleResetPassword = async (id: string) => {
    const newPassword = prompt(t('newPasswordPrompt'));
    if (!newPassword) return;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resetPassword', newPassword })
    });
    if (res.ok) {
      alert(t('passwordResetSuccess'));
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  if (loading) return <div className="text-center py-10">{t('loading')}</div>;

  const filteredClaims = claims.filter(c => c.userName.toLowerCase().includes(searchName.toLowerCase()));
  const totalAmount = filteredClaims.reduce((sum, c) => sum + c.fee, 0);

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-2 flex flex-col h-full">
       <header className="flex justify-between items-center mb-6">
         <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <ShieldAlert className="text-slate-400" size={28} />
             {t('adminPanel')}
           </h2>
         </div>
         <div className="flex flex-row gap-3">
            <Link href="/dashboard" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm flex items-center justify-center font-semibold transition-colors shadow-sm">{t('backToDash')}</Link>
         </div>
       </header>

       <div className="flex space-x-2 border-b border-slate-200 mb-6 font-semibold">
         <button 
           className={`px-4 py-3 flex items-center gap-2 border-b-2 text-sm transition-colors ${activeTab === 'claims' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
           onClick={() => setActiveTab('claims')}
         >
           <FileText size={18} />
           {t('claimsTab')}
         </button>
         {myRole === 'admin' && (
           <>
             <button 
               className={`px-4 py-3 flex items-center gap-2 border-b-2 text-sm transition-colors ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
               onClick={() => setActiveTab('users')}
             >
               <UserCog size={18} />
               {t('usersTab')}
             </button>
             <button 
               className={`px-4 py-3 flex items-center gap-2 border-b-2 text-sm transition-colors ${activeTab === 'parking-lots' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
               onClick={() => setActiveTab('parking-lots')}
             >
               <Car size={18} />
               {t('parkingLotsTab')}
             </button>
           </>
         )}
       </div>

       {activeTab === 'claims' && (
         <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
           <div className="px-6 py-4 flex flex-col xl:flex-row justify-between items-start xl:items-center bg-slate-50 border-b border-slate-200 gap-4">
             <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-wrap">
               <div className="flex items-center gap-2">
                 <span className="text-sm text-slate-500 font-medium">{t('period')}</span>
                 <input 
                   type="date" 
                   value={startDate} 
                   onChange={(e) => setStartDate(e.target.value)} 
                   className="text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-blue-500" 
                 />
                 <span className="text-slate-400">~</span>
                 <input 
                   type="date" 
                   value={endDate} 
                   onChange={(e) => setEndDate(e.target.value)} 
                   className="text-sm border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-blue-500" 
                 />
               </div>
               <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center justify-center whitespace-nowrap">
                 {t('totalAmount')}: {totalAmount.toLocaleString()} {t('currency')}
               </div>
               <div className="relative">
                 <input 
                   type="text" 
                   placeholder={t('searchNamePlaceholder')} 
                   value={searchName} 
                   onChange={(e) => setSearchName(e.target.value)}
                   className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 w-full md:w-48 placeholder-slate-400"
                 />
               </div>
             </div>
             
             <button 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center shadow-sm transition-colors text-sm whitespace-nowrap"
                onClick={handleDownload}
              >
                <Download size={16} className="mr-2" />
                {t('exportCsv')}
              </button>
           </div>
           <div className="overflow-x-auto flex-1">
             <table className="w-full text-left border-collapse min-w-[800px]">
               <thead>
                 <tr className="border-b border-slate-200 bg-slate-50">
                   <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('userName')}</th>
                   <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('accountCol')}</th>
                   <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('entryTime')}</th>
                   <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">{t('feeCol')}</th>
                   <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('parkingCol')}</th>
                   <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('timeCol')}</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {filteredClaims.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="text-center py-12 text-slate-500 bg-slate-50/50">
                       {t('noWeeklyClaims')}
                     </td>
                   </tr>
                 ) : (
                   filteredClaims.map((claim) => (
                     <tr 
                       key={claim.id} 
                       className="hover:bg-slate-100 transition-colors cursor-pointer"
                       onClick={() => setSelectedClaim(claim)}
                     >
                       <td className="py-4 px-6 text-slate-800 font-medium whitespace-nowrap">{claim.userName}</td>
                       <td className="py-4 px-6 text-slate-600 text-sm font-mono">{claim.accountInfo}</td>
                       <td className="py-4 px-6 text-slate-600 text-sm">{claim.entryTime}</td>
                       <td className="py-4 px-6 font-bold text-slate-800 text-right">{claim.fee.toLocaleString()} {t('currency')}</td>
                       <td className="py-4 px-6 text-slate-600 font-medium">{claim.parkingName}</td>
                       <td className="py-4 px-6 text-slate-500 text-sm">
                         {new Date(claim.createdAt).toLocaleDateString()}
                       </td>
                     </tr>
                   ))
                 )}
                </tbody>
             </table>
           </div>
         </div>
       )}

       {activeTab === 'users' && myRole === 'admin' && (
         <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
           <div className="overflow-x-auto flex-1">
             <table className="w-full text-left border-collapse min-w-[900px]">
               <thead>
                 <tr className="border-b border-slate-200 bg-slate-50">
                   <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('userName')}</th>
                   <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('email')}</th>
                   <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('roleCol')}</th>
                   <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('timeCol')}</th>
                   <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">{t('actionCol')}</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {users.map((user) => (
                   <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                     <td className="py-4 px-6 text-slate-800 font-medium">{user.name}</td>
                     <td className="py-4 px-6 text-slate-600 text-sm font-mono">{user.email}</td>
                     <td className="py-4 px-6">
                       <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : user.role === 'manager' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                         {user.role}
                       </span>
                     </td>
                     <td className="py-4 px-6 text-slate-500 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                     <td className="py-4 px-6 text-right space-x-2">
                       <button onClick={() => handleResetPassword(user.id)} title={t('resetPasswordBtn')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors inline-block text-sm">
                         <KeyRound size={16} />
                       </button>
                       <button onClick={() => handleChangeRole(user.id, user.role)} title={t('changeRoleBtn')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors inline-block text-sm">
                         <UserCog size={16} />
                       </button>
                       <button onClick={() => handleDeleteUser(user.id)} title={t('deleteUserBtn')} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors inline-block text-sm">
                         <Trash2 size={16} />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       )}

       {activeTab === 'parking-lots' && myRole === 'admin' && (
         <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
           <div className="px-6 py-4 flex justify-between items-center bg-slate-50 border-b border-slate-200">
             <h3 className="text-sm font-semibold text-slate-700">{t('parkingLotsTab')}</h3>
             <button 
               onClick={() => {
                 const name = prompt(t('parkingLotName'));
                 if (!name) return;
                 const maxFeeStr = prompt(t('maxFee'));
                 if (!maxFeeStr) return;
                 const maxFee = parseInt(maxFeeStr, 10);
                 if (isNaN(maxFee)) return;
                 
                 fetch('/api/admin/parking-lots', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ name, maxFee })
                 }).then(res => res.json()).then(data => {
                   if (data.success) fetchParkingLots();
                   else alert(data.error);
                 });
               }}
               className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center shadow-sm transition-colors text-sm"
             >
               <Plus size={16} className="mr-2" />
               {t('addParkingLot')}
             </button>
           </div>
           
           <div className="overflow-x-auto flex-1">
             <table className="w-full text-left border-collapse min-w-[600px]">
               <thead>
                 <tr className="border-b border-slate-200 bg-slate-50">
                   <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('parkingLotName')}</th>
                   <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('maxFee')}</th>
                   <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">{t('actionCol')}</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {parkingLots.length === 0 ? (
                   <tr>
                     <td colSpan={3} className="text-center py-12 text-slate-500 bg-slate-50/50">
                       {t('noParkingLots')}
                     </td>
                   </tr>
                 ) : (
                   parkingLots.map((lot) => (
                     <tr key={lot.id} className="hover:bg-slate-50 transition-colors">
                       <td className="py-4 px-6 text-slate-800 font-medium">{lot.name}</td>
                       <td className="py-4 px-6 text-slate-600 font-mono font-semibold">{lot.maxFee.toLocaleString()} {t('currency')}</td>
                       <td className="py-4 px-6 text-right space-x-2">
                         <button 
                           onClick={() => {
                             const name = prompt(t('parkingLotName'), lot.name);
                             if (!name) return;
                             const maxFeeStr = prompt(t('maxFee'), lot.maxFee.toString());
                             if (!maxFeeStr) return;
                             const maxFee = parseInt(maxFeeStr, 10);
                             if (isNaN(maxFee)) return;
                             
                             fetch(`/api/admin/parking-lots`, {
                               method: 'PATCH',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ id: lot.id, name, maxFee })
                             }).then(res => res.json()).then(data => {
                               if (data.success) fetchParkingLots();
                               else alert(data.error);
                             });
                           }}
                           title={t('edit')} 
                           className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors inline-block text-sm"
                         >
                           <Edit2 size={16} />
                         </button>
                         <button 
                           onClick={() => {
                             if (!confirm(t('confirmDeleteParkingLot'))) return;
                             fetch(`/api/admin/parking-lots?id=${lot.id}`, { method: 'DELETE' })
                               .then(res => res.json())
                               .then(data => {
                                 if (data.success) fetchParkingLots();
                                 else alert(data.error);
                               });
                           }}
                           title={t('delete')} 
                           className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors inline-block text-sm"
                         >
                           <Trash2 size={16} />
                         </button>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
         </div>
       )}

       {selectedClaim && (
         <div 
           className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4"
           onClick={() => setSelectedClaim(null)}
         >
           <div 
             className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
             onClick={(e) => e.stopPropagation()}
           >
             <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                 <FileText size={20} className="text-blue-600" />
                 {t('claimDetails')}
               </h3>
               <button 
                 onClick={() => setSelectedClaim(null)}
                 className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
               >
                 <span className="sr-only">Close</span>
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
               </button>
             </div>
             
             <div className="p-6 overflow-y-auto">
               <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
                 <div>
                   <label className="text-xs font-semibold text-slate-400 uppercase">{t('userName')}</label>
                   <p className="font-medium text-slate-800 mt-1">{selectedClaim.userName}</p>
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-slate-400 uppercase">{t('accountCol')}</label>
                   <p className="font-mono text-sm text-slate-700 mt-1">{selectedClaim.accountInfo}</p>
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-slate-400 uppercase">{t('parkingName')}</label>
                   <p className="font-medium text-slate-800 mt-1">{selectedClaim.parkingName}</p>
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-slate-400 uppercase">{t('feeCol')}</label>
                   <p className="font-bold text-blue-600 mt-1">{selectedClaim.fee.toLocaleString()} {t('currency')}</p>
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-slate-400 uppercase">{t('entryTime')}</label>
                   <p className="font-mono text-sm text-slate-700 mt-1">{selectedClaim.entryTime}</p>
                 </div>
                 <div>
                   <label className="text-xs font-semibold text-slate-400 uppercase">{t('exitTime')}</label>
                   <p className="font-mono text-sm text-slate-700 mt-1">{selectedClaim.exitTime}</p>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-3">{t('receiptImg')}</label>
                 <div className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center min-h-[300px] p-2 relative h-[500px]">
                   {selectedClaim.imageUrl ? (
                     <Image 
                       src={selectedClaim.imageUrl} 
                       alt="Receipt" 
                       fill
                       className="object-contain rounded-lg shadow-sm"
                     />
                   ) : (
                     <div className="text-slate-400 text-sm">No image available</div>
                   )}
                 </div>
               </div>
             </div>
             
             <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
               <button 
                 onClick={() => setSelectedClaim(null)}
                 className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
               >
                 {t('close')}
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
