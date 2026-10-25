'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { saveSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password })
      });
      saveSession(data.token, data.user);
      if (data.user.role === 'ADMIN') router.push('/admin/dashboard');
      else if (data.user.role === 'PATIENT') router.push('/Randevu_Al');
      else router.push('/home_page');
    } catch (err) {
      alert(err.message || 'Giriş yapılamadı.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[url('/login_images/background.jpg')] bg-cover">
      <form onSubmit={handleLogin} className="p-8 bg-white rounded shadow-md w-96">
        <img src="/login_images/logo.png" alt="Logo" className="mb-4 w-32 h-32 mx-auto" />
        <h2 className="text-2xl font-bold mb-4 text-center">Giriş Yap</h2>
        
        <input 
          type="email" 
          placeholder="E-posta" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        
        <input 
          type="password" 
          placeholder="Şifre" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        
        
        <button type="submit" className="w-full bg-[#6b8bc4] text-white p-2 rounded hover:bg-[#3c4e6e]">
          Giriş
        </button>

        <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
           Hesabınız yok mu?{' '}
          <Link href="/register" className="text-[#6b8bc4] font-semibold hover:underline">
            Kayıt ol
          </Link>
        </p>
        </div>
        

        <img src="/login_images/line.png" alt="Logo" className="m-6 w-90 h-8 mx-auto" />
      </form>
    </div>
  );
}