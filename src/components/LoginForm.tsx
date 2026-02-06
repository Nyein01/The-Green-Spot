import React, { useState, useEffect } from 'react';
import { Leaf, Lock, User, Users, Check, Fingerprint, ScanLine, Globe } from 'lucide-react';
import { translations, Language } from '../utils/translations';

interface LoginFormProps {
  onLogin: (shopId: 'greenspot' | 'nearcannabis', isSuperAdmin: boolean, staffName: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, language, setLanguage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = translations[language];

  // Load saved credentials on mount
  useEffect(() => {
    const saved = localStorage.getItem('gs_creds');
    if (saved) {
      try {
        const { u, p } = JSON.parse(atob(saved));
        setUsername(u);
        setPassword(p);
        setRememberMe(true);
      } catch (e) {
        localStorage.removeItem('gs_creds');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate network/scan delay
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
        }
    }

    // Manager & Admin Logins (Password: 0000)
    if (pass === '0000') { 
        if (user === 'greenspot') {
            onLogin('greenspot', false, 'Manager');
            success = true;
        } else if (user === 'admin') {
            onLogin('greenspot', true, 'Super Admin'); 
            success = true;
        }
    }

    if (success) {
        if (rememberMe) {
            localStorage.setItem('gs_creds', btoa(JSON.stringify({ u: username, p: password })));
        } else {
            localStorage.removeItem('gs_creds');
        }
    } else {
        setError(t.accessDenied);
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#0f172a]">
      {/* Rick and Morty Space Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{
            backgroundImage: `url('https://wallpaperaccess.com/full/159512.jpg')`,
            opacity: 0.6
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
            animation: scan 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Language Switcher Top Right */}
      <div className="absolute top-6 right-6 z-20">
          <div className="bg-black/60 backdrop-blur-md rounded-full p-1 flex items-center border border-white/10 shadow-lg">
              {(['en', 'th', 'mm'] as Language[]).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${language === lang ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}`}
                  >
                      {lang.toUpperCase()}
                  </button>
              ))}
          </div>
      </div>

      {/* Login Card */}
      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/10 z-10 ring-1 ring-white/5">
        
        {/* Scanner Overlay */}
        {loading && (
            <div className="absolute inset-0 z-50 pointer-events-none">
                <div className="absolute left-0 right-0 h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-scan"></div>
                <div className="absolute inset-0 bg-green-500/10"></div>
            </div>
        )}

        <div className="p-8 text-center border-b border-white/10 bg-black/40">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-900/50">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">{t.systemName}</h1>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mt-1">{t.secureTerminal}</p>
        </div>
        
        <div className="p-8 bg-white dark:bg-gray-900/80 backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100 flex items-center animate-shake">
                <ScanLine className="w-4 h-4 mr-2 flex-shrink-0" /> {error}
              </div>
            )}
            
            <div className="space-y-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                        className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all disabled:opacity-50 text-sm font-medium"
                        placeholder={t.username}
                    />
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                    </div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all disabled:opacity-50 text-sm font-medium tracking-widest"
                        placeholder={t.password}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer group">
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="sr-only"
                        />
                        <div className={`w-4 h-4 border rounded transition-colors flex items-center justify-center ${rememberMe ? 'bg-green-600 border-green-600' : 'border-gray-300 bg-white'}`}>
                            {rememberMe && <Check className="w-3 h-3 text-white" />}
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium group-hover:text-green-600 transition-colors">{t.rememberMe}</span>
                </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full relative overflow-hidden flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white transition-all transform hover:-translate-y-0.5 active:scale-95 ${loading ? 'bg-gray-800 cursor-wait' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Fingerprint className="w-5 h-5 animate-pulse text-green-200" />
                  <span className="animate-pulse text-green-100">{t.authenticating}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>{t.login}</span>
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};