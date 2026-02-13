import React, { useState } from 'react';
import { Leaf, Lock, User, ArrowRight, ScanLine, ShieldCheck, Store, MapPin, CheckCircle2, ShoppingBag } from 'lucide-react';
import { translations, Language } from '../utils/translations';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";

interface LoginFormProps {
  onLogin: (shopId: 'greenspot' | 'nearcannabis' | 'smallshop', isSuperAdmin: boolean, staffName: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, language, setLanguage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showShopSelection, setShowShopSelection] = useState(false);
  
  // Track if the user is an Admin (password) or Staff (Google)
  const [authType, setAuthType] = useState<'admin' | 'google' | null>(null);
  const [googleUser, setGoogleUser] = useState<any>(null);

  const t = translations[language];

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        setGoogleUser(user);
        setAuthType('google');
        setShowShopSelection(true);
    } catch (error: any) {
        console.error(error);
        setError("Google Sign-In failed. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate slight network delay for effect
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = username.toLowerCase().trim();
    const pass = password.trim();
    let success = false;

    // Staff & Shop Logins (Password: 1234)
    if (pass === '1234') {
        if (user === 'nyein') {
            onLogin('greenspot', false, 'Staff 1 (Nyein)');
            success = true;
        } else if (user === 'kevin') {
            onLogin('greenspot', false, 'Staff 2 (Kevin)');
            success = true;
        } else if (user === 'nearcannabis' || user === 'nearcanabis') {
            onLogin('nearcannabis', false, 'Staff (Near Cannabis)');
            success = true;
        } else if (user === 'smallshop') {
            onLogin('smallshop', false, 'Staff (Small Shop)');
            success = true;
        }
    }

    // Manager & Admin Logins (Password: 0000)
    if (pass === '0000') { 
        if (user === 'greenspot') {
            onLogin('greenspot', false, 'Manager');
            success = true;
        } else if (user === 'admin') {
            // Intercept Admin Login to force Shop Selection
            setAuthType('admin');
            setShowShopSelection(true);
            setLoading(false);
            return;
        }
    }

    if (!success) {
        setError(t.accessDenied);
        setLoading(false);
    }
  };

  const handleShopSelection = (shopId: 'greenspot' | 'nearcannabis' | 'smallshop') => {
      if (authType === 'admin') {
          onLogin(shopId, true, 'Super Admin');
      } else if (authType === 'google' && googleUser) {
          onLogin(shopId, false, googleUser.displayName || 'Google User');
      }
  };

  // --- SHOP SELECTION SCREEN ---
  if (showShopSelection) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black"></div>
            
            <div className="relative z-10 w-full max-w-4xl animate-fade-in">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-4 ring-1 ring-white/20">
                        {authType === 'admin' ? (
                             <ShieldCheck className="w-8 h-8 text-red-500" />
                        ) : (
                             <User className="w-8 h-8 text-green-400" />
                        )}
                    </div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">
                        {authType === 'admin' ? 'Admin Access Granted' : `Welcome, ${googleUser?.displayName?.split(' ')[0]}`}
                    </h2>
                    <p className="text-slate-400">
                        {authType === 'admin' ? 'Select the location to manage.' : 'Select your work location for today.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* The Green Spot Card */}
                    <button 
                        onClick={() => handleShopSelection('greenspot')}
                        className="group relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-green-500 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-green-900/20 hover:-translate-y-1"
                    >
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                        </div>
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500 group-hover:text-white transition-colors text-green-500">
                            <Leaf className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">The Green Spot</h3>
                        <p className="text-sm text-slate-500 group-hover:text-slate-400">Main Dispensary</p>
                    </button>

                    {/* Near Cannabis Card */}
                    <button 
                        onClick={() => handleShopSelection('nearcannabis')}
                        className="group relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-1"
                    >
                         <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CheckCircle2 className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-500">
                            <Store className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">Near Cannabis</h3>
                        <p className="text-sm text-slate-500 group-hover:text-slate-400">Partner Location</p>
                    </button>

                    {/* Small Shop Card */}
                    <button 
                        onClick={() => handleShopSelection('smallshop')}
                        className="group relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-amber-500 rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-amber-900/20 hover:-translate-y-1"
                    >
                         <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CheckCircle2 className="w-6 h-6 text-amber-500" />
                        </div>
                        <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors text-amber-500">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">Small Shop</h3>
                        <p className="text-sm text-slate-500 group-hover:text-slate-400">Boutique Store</p>
                    </button>
                </div>

                <div className="mt-12 text-center">
                    <button onClick={() => { setShowShopSelection(false); setAuthType(null); setGoogleUser(null); }} className="text-slate-500 hover:text-white text-sm">
                        Cancel and return to login
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // --- LOGIN SCREEN ---
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-green-500/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        
        {/* Logo/Brand Area */}
        <div className="text-center mb-8 animate-fade-in">
           <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-700 shadow-2xl shadow-green-900/50 mb-6 rotate-3 hover:rotate-6 transition-transform duration-500 border border-green-400/20">
               <Leaf className="w-10 h-10 text-white" />
           </div>
           <h1 className="text-3xl font-black text-white tracking-tight mb-2 drop-shadow-lg">{t.systemName}</h1>
           <div className="flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
              <p className="text-green-400/80 text-xs font-bold uppercase tracking-[0.2em]">{t.secureTerminal}</p>
           </div>
        </div>

        {/* Glass Card */}
        <div className="glass-panel rounded-3xl p-1 shadow-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="bg-slate-900/60 rounded-[20px] p-8 border border-white/5 relative overflow-hidden">
                
                {loading && (
                    <div className="absolute inset-0 bg-black/50 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                        <ScanLine className="w-10 h-10 text-green-400 animate-spin-slow mb-3" />
                        <span className="text-green-400 text-xs font-mono tracking-widest">{t.authenticating}</span>
                    </div>
                )}

                <form onSubmit={handleManualLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="group relative">
                            <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-green-400 transition-colors" />
                            <input 
                                type="text"
                                placeholder={t.username}
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
                            />
                        </div>
                        
                        <div className="group relative">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-green-400 transition-colors" />
                            <input 
                                type="password"
                                placeholder={t.password}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all tracking-widest"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/30 p-3 rounded-lg border border-red-900/50">
                            <ShieldCheck className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full group relative bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <div className="relative flex items-center justify-center gap-2">
                            <span>{t.login}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </form>

                <div className="my-6 flex items-center justify-center space-x-4 opacity-50">
                    <div className="h-px bg-slate-600 w-full"></div>
                    <span className="text-xs text-slate-400 uppercase">OR</span>
                    <div className="h-px bg-slate-600 w-full"></div>
                </div>

                <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                </button>

                <div className="mt-8 flex justify-center gap-2">
                    {(['en', 'th', 'mm'] as Language[]).map(lang => (
                        <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all border ${
                                language === lang 
                                ? 'bg-white/10 text-white border-white/20' 
                                : 'text-slate-500 border-transparent hover:text-slate-300'
                            }`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="mt-8 text-center">
            <p className="text-slate-600 text-[10px]">
                Powered by <span className="text-slate-400 font-bold">Cloud POS v3.1</span>
            </p>
        </div>

      </div>
    </div>
  );
};
