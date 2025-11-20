
import React, { useState } from 'react';
import { USERS } from '../constants';
import { User } from '../types';
import { Lock, User as UserIcon, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (user && user.password === password) {
      onLogin(user);
    } else {
      setError('Invalid credentials. Please check your username or password.');
    }
  };

  const handleGoogleResponse = (response: any) => {
    try {
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        
        const user = USERS.find(u => u.email === payload.email);
        if (user) {
            onLogin(user);
        } else {
            setError('This Google account is not linked to a Heartiee user.');
        }
    } catch (e) {
        console.error(e);
        setError('Failed to decode Google sign-in response.');
    }
  };

  React.useEffect(() => {
    // @ts-ignore
    if (window.google) {
        // @ts-ignore
        window.google.accounts.id.initialize({
            client_id: "YOUR_GOOGLE_CLIENT_ID",
            callback: handleGoogleResponse
        });
        // @ts-ignore
        window.google.accounts.id.renderButton(
            document.getElementById("googleSignInDiv"),
            { theme: "outline", size: "large", width: "100%" }
        );
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-primary-500"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gray-200 rounded-full blur-3xl opacity-50"></div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[400px] overflow-hidden relative z-10 border border-white/50">
        
        <div className="p-10 text-center">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-200 rotate-3">
             <div className="w-10 h-10 border-2 border-white rounded-lg"></div>
          </div>
          <h1 className="text-3xl font-bold text-secondary tracking-tight">Heartiee</h1>
          <p className="text-gray-400 text-xs uppercase tracking-[0.2em] mt-2">Studio CRM</p>
        </div>
        
        <div className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase ml-1">Username</label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 p-3.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all placeholder:text-gray-400"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 p-3.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all placeholder:text-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-lg text-center border border-red-100">{error}</div>}

            <button 
              type="submit" 
              className="w-full bg-secondary text-white py-3.5 rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 group shadow-lg shadow-gray-200 mt-2"
            >
              Sign In <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-gray-300 text-xs font-medium">OR</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <div id="googleSignInDiv" className="mt-2 flex justify-center"></div>

          <div className="mt-8 pt-6 border-t border-dashed border-gray-100">
            <p className="text-[10px] text-center text-gray-400 uppercase tracking-wider mb-4">Quick Access (Dev)</p>
            <div className="flex justify-center gap-2">
              <button 
                className="px-3 py-1.5 bg-surface-50 rounded-lg text-[10px] font-semibold text-gray-500 hover:bg-primary-50 hover:text-primary-700 border border-transparent hover:border-primary-200 transition-colors"
                onClick={() => { 
                    setUsername('admin'); 
                    setPassword('admin@123'); 
                }}
              >
                Admin
              </button>
              <button 
                className="px-3 py-1.5 bg-surface-50 rounded-lg text-[10px] font-semibold text-gray-500 hover:bg-primary-50 hover:text-primary-700 border border-transparent hover:border-primary-200 transition-colors"
                onClick={() => { 
                    setUsername('designer'); 
                    setPassword('design@123'); 
                }}
              >
                Designer
              </button>
              <button 
                className="px-3 py-1.5 bg-surface-50 rounded-lg text-[10px] font-semibold text-gray-500 hover:bg-primary-50 hover:text-primary-700 border border-transparent hover:border-primary-200 transition-colors"
                onClick={() => { 
                    setUsername('assistant'); 
                    setPassword('data@123'); 
                }}
              >
                Assistant
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-gray-400 text-xs font-medium">© 2024 Heartiee Design Studio</p>
    </div>
  );
};

export default Login;
