'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearSession } from '@/lib/auth'; 

export default function Admin_Navbar() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <>
      <header className="flex justify-between items-center px-8 py-4 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/login_images/logo.png" alt="Logo" className="w-20 h-20" />
          <span className="text-2xl font-bold text-gray-800">Şifa klinik</span>
        </div> 
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="px-4 py-2 text-[#6b8bc4] border border-[#6b8bc4] rounded-lg hover:bg-[#FF4E6E] hover:text-white transition"
          >
            Çıkış Yap
          </button>


          <Link href="/admin/doktorlar" className="px-4 py-2 text-[#6b8bc4] border border-[#6b8bc4] rounded-lg hover:bg-[#6b8bc4] hover:text-white transition">
            Doktorlar
          </Link>
          <Link href="/admin/randevular" className="px-4 py-2 text-[#6b8bc4] border border-[#6b8bc4] rounded-lg hover:bg-[#6b8bc4] hover:text-white transition">
            Randevular
          </Link>
          <Link href="/admin/dashboard" className="px-4 py-2 bg-[#6b8bc4] text-white rounded-lg hover:bg-[#3c4e6e] transition">
            Dashboard
          </Link>
        </div> 
      </header>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Çıkış Yap</h3>
            <p className="text-gray-600 mb-6">Hesabınızdan çıkış yapmak istediğinize emin misiniz?</p>
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition w-full"
              >
              Hayır
              </button>
              
              <button 
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition w-full"
              >
                Evet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}