'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    // Password confirmation
    if (password !== confirmPassword) {
      alert("İki şifre eşleşmiyor. Lütfen tekrar deneyin.");
      return;
    }

    if (password.length < 8) {
      alert('Şifre en az 8 karakter olmalıdır.');
      return;
    }
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ full_name: fullName, email, password })
      });
      alert('Kayıt başarılı! Giriş yapabilirsiniz.');
      router.push('/login');
    } catch (error) {
      alert(error.message || 'Kayıt sırasında bir hata oluştu.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[url('/login_images/background.jpg')] bg-cover">
      <form onSubmit={handleRegister} className="p-8 bg-white rounded shadow-md w-96">
        <img src="/login_images/logo.png" alt="Logo" className="mb-4 w-32 h-32 mx-auto" />
        <h2 className="text-2xl font-bold mb-4 text-center">Kayıt Ol</h2>
        
        {/* حقل الاسم الكامل يتطابق مع قاعدة البيانات */}
        <input 
          type="text" 
          placeholder="Ad Soyad" 
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />

        <input 
          type="email" 
          placeholder="E-posta" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        
        <input 
          type="password" 
          placeholder="Şifre" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        
        <input 
          type="password" 
          placeholder="Şifre Tekrar" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        
        <button type="submit" className="w-full bg-[#6b8bc4] text-white p-2 rounded hover:bg-[#3c4e6e]">
          Kayıt Ol
        </button>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Hesabınız var mı?{' '}
            <Link href="/login" className="text-[#6b8bc4] font-semibold hover:underline">
              Giriş yap
            </Link>
          </p>
        </div>

        <img src="/login_images/line.png" alt="Line" className="m-6 w-90 h-8 mx-auto" />
      </form>
    </div>
  );
}