import React, { useState } from 'react';
import { Leaf, Lock, User, Loader2, Users } from 'lucide-react';

interface LoginFormProps {
  onLogin: (shopId: 'greenspot' | 'nearcannabis', isSuperAdmin: boolean, staffName: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate network delay for a smooth feel
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = username.toLowerCase().trim();
    const pass = password.trim();

    // Specific Staff Logins (Password: 1234)
    if (pass === '1234') {
        if (user === 'nyein') {
            onLogin('greenspot', false, 'Staff 1 (Nyein)');
            return;
        }
        if (user === 'kevin') {
            onLogin('greenspot', false, 'Staff 2 (Kevin)');
            return;
        }
    }

    // General Shop & Admin Logins (Password: 0000)
    if (pass === '0000') { 
        if (user === 'greenspot') {
            onLogin('greenspot', false, 'Manager');
            return;
        }
        if (user === 'nearcannabis' || user === 'nearcanabis') {
            onLogin('nearcannabis', false, 'Staff');
            return;
        }
        if (user === 'admin') {
            onLogin('greenspot', true, 'Super Admin'); // Admin starts at greenspot but can switch
            return;
        }
        // Fallback: Allow Nyein/Kevin to use 0000 as well if needed
        if (user === 'nyein') {
             onLogin('greenspot', false, 'Staff 1 (Nyein)');
             return;
        }
        if (user === 'kevin') {
             onLogin('greenspot', false, 'Staff 2 (Kevin)');
             return;
        }
    }

    setError("Invalid username or password.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="bg-gradient-to-br from-green-600 to-green-700 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md shadow-lg relative z-10">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1 relative z-10">POS System</h1>
          <p className="text-green-100 text-xs font-medium relative z-10 uppercase tracking-wider">Authorized Access</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-800 flex items-center animate-shake">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-green-600">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700"
                  placeholder="e.g., nyein, kevin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-green-600">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                    <Users className="w-5 h-5 mr-2" />
                    Start Shift
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};