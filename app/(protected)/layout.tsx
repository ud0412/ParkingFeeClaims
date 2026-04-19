'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Receipt, History, LogOut, ShieldAlert, UserCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{name: string, email: string, role?: string, passwordUpdatedAt?: string} | null>(null);
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(d => {
      if(!d.error) {
        setUser(d);
        if (d.passwordUpdatedAt) {
          const updatedTime = new Date(d.passwordUpdatedAt).getTime();
          const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
          if (Date.now() - updatedTime > thirtyDaysInMs) {
            setShowPasswordAlert(true);
          }
        }
      }
    });
  }, []);

  const handleExtendPassword = async () => {
    await fetch('/api/user/password-extend', { method: 'POST' });
    setShowPasswordAlert(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', label: t('dashboard'), icon: Home },
    { href: '/claim', label: t('claim'), icon: Receipt },
    { href: '/history', label: t('history'), icon: History },
    { href: '/profile', label: t('profile'), icon: UserCircle },
  ];

  return (
    <div className="flex h-full w-full bg-slate-50 relative">
      {showPasswordAlert && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
             <h3 className="text-xl font-bold text-slate-800 mb-2">{t('passwordExpired')}</h3>
             <p className="text-slate-600 mb-6 text-[0.95rem]">{t('passwordExpiredDesc')}</p>
             <div className="flex flex-col sm:flex-row gap-3 justify-end">
               <button 
                 onClick={handleExtendPassword}
                 className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
               >
                 {t('extend30Days')}
               </button>
               <button 
                 onClick={() => { setShowPasswordAlert(false); router.push('/profile'); }}
                 className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
               >
                 {t('goToPasswordChange')}
               </button>
             </div>
          </div>
        </div>
      )}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col p-6 shrink-0 h-full overflow-y-auto hidden md:flex">
        <div className="text-[1.25rem] font-extrabold text-blue-600 mb-12 flex items-center gap-2">
          <span className="text-2xl">🅿️</span> {t('appTitle')}
        </div>
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`py-3 px-4 rounded-lg cursor-pointer text-[0.95rem] flex items-center gap-3 transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
          {['admin', 'manager'].includes(user?.role || '') && (
            <Link 
              href="/admin"
              className={`py-3 px-4 rounded-lg cursor-pointer text-[0.95rem] flex items-center gap-3 transition-colors ${
                pathname.startsWith('/admin') ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <ShieldAlert size={18} />
              {t('adminPanel')} <span className="px-1.5 py-0.5 bg-slate-100 text-[0.7rem] rounded font-medium text-slate-500 ml-auto uppercase">{user?.role}</span>
            </Link>
          )}
        </nav>
        
        <div className="pt-6 border-t border-slate-200 mt-6 text-[0.85rem] flex flex-col">
          {user ? (
            <div className="mb-6">
              <b className="block text-slate-800 mb-1 font-semibold">{user.name}</b>
              <span className="text-slate-500">{user.email}</span>
            </div>
          ) : (
            <div className="mb-6 text-slate-400">{t('loadingUser')}</div>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center text-slate-500 hover:text-red-500 transition-colors font-medium text-sm text-left"
          >
            <LogOut size={16} className="mr-2" />
            {t('logout')}
          </button>
        </div>
      </aside>
      
      {/* Mobile nav fallback (simple top bar) */}
      <div className="flex md:hidden flex-col flex-1 h-full h-screen w-full">
         <header className="bg-white border-b border-slate-200 px-4 py-4 flex justify-between items-center">
            <div className="text-lg font-extrabold text-blue-600 flex items-center gap-2">
              <span className="text-xl">🅿️</span> {t('appTitle')}
            </div>
            <button onClick={handleLogout} className="text-slate-500"><LogOut size={20}/></button>
         </header>
         <nav className="bg-white border-b border-slate-200 px-2 py-2 flex overflow-x-auto gap-2">
           {navItems.map(item => (
             <Link key={item.href} href={item.href} className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium ${pathname.startsWith(item.href) ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>{item.label}</Link>
           ))}
           {['admin', 'manager'].includes(user?.role || '') && (
             <Link href="/admin" className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium ${pathname.startsWith('/admin') ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>{t('admin')}</Link>
           )}
         </nav>
         <main className="flex-1 overflow-y-auto p-4 md:p-10 flex flex-col gap-6">
           {children}
         </main>
      </div>

      <main className="hidden md:flex flex-1 overflow-y-auto p-10 flex-col gap-6">
        {children}
      </main>
    </div>
  );
}
