'use client';
import { useEffect, useState } from 'react';
import { UserCircle, Save, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { LanguageSelector } from '@/components/LanguageSelector';

interface User {
  name: string;
  email: string;
  accountInfo: string;
}

const BANKS = [
  'KB국민은행', '신한은행', '우리은행', '하나은행', 'NH농협은행', 
  'IBK기업은행', '카카오뱅크', '토스뱅크', '케이뱅크', '새마을금고', 
  '우체국', 'SC제일은행', '부산은행', '대구은행'
];

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [bank, setBank] = useState('');
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const { t } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetch('/api/user')
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setUser(d);
          const info = d.accountInfo || '';
          const parts = info.split(' ');
          if (parts.length > 1 && BANKS.includes(parts[0])) {
            setBank(parts[0]);
            setAccount(parts.slice(1).join(' '));
          } else {
            setBank('');
            setAccount(info);
          }
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const combinedAccountInfo = bank ? `${bank} ${account}` : account;
    if (!combinedAccountInfo.trim() || !bank || !account.trim()) {
      setMessage({ type: 'error', text: '은행을 선택하고 계좌 번호를 입력해주세요.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountInfo: combinedAccountInfo })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: t('saveSuccess') });
    } catch (err: any) {
      setMessage({ type: 'error', text: t('saveFail') });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: t('passwordMismatch') });
      return;
    }
    
    setPasswordSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: t('passwordChanged') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      
      // Update passwordUpdatedAt local state by forcing a refetch or simple location reload
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('passwordChangeFailed') });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10">{t('loadingUser')}</div>;
  if (!user) return <div className="text-center py-10">회원 정보를 불러올 수 없습니다.</div>;

  return (
    <div className="space-y-6 flex-1 flex flex-col max-w-4xl mx-auto w-full relative">
      <header className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <UserCircle className="text-slate-400" size={28} />
          {t('profileMgmt')}
        </h1>
      </header>

      {message && (
        <div className={`p-4 rounded-lg flex items-center text-sm border mb-4 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
          {message.text}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">{t('basicInfo')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{t('name')}</label>
            <div className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-[0.95rem]">
              {user.name}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{t('emailAccount')}</label>
            <div className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-[0.95rem]">
              {user.email}
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-6 border-t border-slate-100 pt-8">{t('settlementAccountInfo')}</h3>
        <div className="max-w-xl">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{t('accountInfo')}</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="px-4 py-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 text-[0.95rem] outline-none transition-shadow min-w-[140px]"
            >
              <option value="" disabled>{t('selectBank')}</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <input 
              type="text" 
              value={account}
              onChange={(e) => setAccount(e.target.value.replace(/[^0-9-]/g, ''))}
              placeholder={t('accountNumber')}
              className="flex-1 px-4 py-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 text-[0.95rem] outline-none transition-shadow"
            />
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap justify-center sm:justify-start"
            >
              <Save size={18} className="mr-2" />
              {saving ? t('savingBtn') : t('saveBtn')}
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-2">{t('accountGuide')}</p>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-6 border-t border-slate-100 pt-8">{t('changePassword')}</h3>
        <form onSubmit={handlePasswordChange} className="max-w-xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{t('currentPassword')}</label>
            <div className="relative">
              <input 
                type={showCurrentPassword ? "text" : "password"} 
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 text-[0.95rem] outline-none"
              />
              <button 
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{t('newPassword')}</label>
            <div className="relative">
              <input 
                type={showNewPassword ? "text" : "password"} 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 text-[0.95rem] outline-none"
              />
              <button 
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{t('confirmNewPassword')}</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 text-[0.95rem] outline-none"
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button 
            type="submit"
            disabled={passwordSaving}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold flex items-center transition-colors shadow-sm disabled:opacity-50"
          >
            <Save size={18} className="mr-2" />
            {passwordSaving ? t('savingBtn') : t('changePassword')}
          </button>
        </form>

        <h3 className="text-lg font-bold text-slate-800 mb-6 border-t border-slate-100 pt-8">{t('languageSettings')}</h3>
        <div className="max-w-xl">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{t('selectLanguage')}</label>
          <div className="flex">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </div>
  );
}
