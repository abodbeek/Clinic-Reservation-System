'use client';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function Home_Page() {
  return (
<div className="flex flex-col min-h-screen bg-[url('/Home_Page_images/wallpaper.jpg')] bg-contain bg-center bg-no-repeat"> 
    <Navbar />     

      <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <div className="bg-white/90 p-8 rounded-xl shadow-lg max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-gray-600 mb-4">Şifa kliniğimize hoş geldiniz!</h1>
          <p className="text-gray-600 mb-6">
            Kolayca randevu alabilir, uzman doktorlarımızı görüntüleyebilir ve <br></br>sağlık geçmişinizi yönetebilirsiniz.
          </p>
          
          <div className="flex justify-center gap-4">
            <Link href="/Randevu_Al" className="bg-[#6b8bc4] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#3c4e6e] transition shadow-md">
              Hemen Randevu Al
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}