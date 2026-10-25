'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiFetch } from '@/lib/api';
export default function DoctorDetailPage() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    apiFetch(`/api/doctors/${encodeURIComponent(id)}`)
      .then(data => { if(active) setDoctor(data.doctor); })
      .catch(err => { if(active) setError(err.message); })
      .finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  return (
    <div className="flex min-h-screen flex-col bg-gray-50"><Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 p-6">
        {loading && <p>Doktor yükleniyor...</p>}
        {error && <p role="alert" className="text-red-600">{error}</p>}
        {doctor && <article className="rounded-xl bg-white p-8 shadow-md">
          <h1 className="mb-2 text-3xl font-bold">{doctor.full_name}</h1>
          <p className="mb-4 text-lg font-semibold text-blue-700">{doctor.specialty}</p>
          <p className="mb-6 whitespace-pre-line text-gray-700">{doctor.biography || 'Biyografi eklenmedi.'}</p>
          <Link href={`/Randevu_Al?doctor=${doctor.id}`} className="inline-block rounded bg-[#6b8bc4] px-6 py-3 font-semibold text-white">Randevu Al</Link>
        </article>}
      </main><Footer /></div>
  );
}
