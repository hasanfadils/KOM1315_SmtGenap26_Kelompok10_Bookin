import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { University, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

const TOKEN_KEY = 'auth_token';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<{ access_token: string; user: User }>('/auth/login', { email, password });
      localStorage.setItem(TOKEN_KEY, response.access_token);
      login(response.user);

      if (response.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (response.user.role === 'staff') {
        navigate('/tendik/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Email atau password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
            <div className="bg-ipb-blue p-3 rounded-xl shadow-lg border border-blue-800">
                <University className="h-10 w-10 text-white" />
            </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Masuk ke TLS IPB
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 font-medium">
          Tools Lab Sharing IPB University
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-4 bg-red-50 p-4 rounded-lg flex items-center gap-3 text-red-700 text-sm border border-red-100 font-medium">
                <AlertCircle className="h-5 w-5" />
                {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleEmailLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-ipb-blue focus:border-ipb-blue sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-ipb-blue focus:border-ipb-blue sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ipb-blue hover:bg-ipb-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ipb-blue disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Masuk'}
              </button>
            </div>
          </form>



          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Belum punya akun?{' '}
              <Link to="/register" className="font-medium text-ipb-blue hover:text-ipb-dark">
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
