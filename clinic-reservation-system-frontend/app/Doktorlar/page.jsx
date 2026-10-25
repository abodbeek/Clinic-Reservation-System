'use client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;
    apiFetch('/api/doctors')
      .then(data => {
        if (mounted) setDoctors((data.doctors || []).map(d => ({
          id: d.id,
          name: d.full_name,
          department: d.specialty,
          experience: d.biography || '',
          image: '/Doktorlar_images/male_doctor.png'
        })));
      })
      .catch(err => { if (mounted) setError(err.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Uzman Doktorlarımız</h1>
          <p className="text-gray-600">Kliniğimizin alanında uzman hekimleriyle tanışın ve hemen randevunuzu oluşturun.</p>
        </div>

        {loading && <p role="status" className="mb-4 text-center text-gray-600">Doktorlar yükleniyor...</p>}
        {error && <p role="alert" className="mb-4 text-center text-red-600">{error}</p>}
        {!loading && !error && doctors.length === 0 && <p className="mb-4 text-center text-gray-600">Aktif doktor bulunamadı.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition flex flex-col items-center p-6 text-center border border-gray-100">
              
              <div className="w-28 h-28 rounded-full bg-blue-50 flex items-center justify-center mb-4 overflow-hidden border-2 border-[#6b8bc4]">
                <img src={doctor.image} alt={doctor.name} className="w-20 h-20 object-contain" />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-1">{doctor.name}</h3>
              <p className="text-[#6b8bc4] font-semibold text-sm mb-2">{doctor.department}</p>
              <p className="text-gray-500 text-xs mb-3">{doctor.experience}</p>
              <div className="text-yellow-500 text-xs font-medium mb-6">{doctor.rating}</div>

              <Link 
                href={`/Randevu_Al?doctor=${doctor.id}`} 
                className="w-full bg-[#6b8bc4] text-white py-2 rounded-lg font-medium hover:bg-[#3c4e6e] transition text-center"
              >
                Randevu Al
              </Link>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}