'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiFetch } from '@/lib/api';
import { getSession } from '@/lib/auth';

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [doctorCount, setDoctorCount] = useState(0);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getSession();
    if (!session?.token) { setError('Lütfen yönetici hesabıyla giriş yapın.'); setLoading(false); return; }
    Promise.all([
      apiFetch('/api/auth/me', { token: session.token }),
      apiFetch('/api/appointments', { token: session.token }),
      apiFetch('/api/doctors')
    ]).then(([me, booking, doctors]) => {
      if (me.user.role !== 'ADMIN') throw new Error('Bu sayfayı görüntüleme yetkiniz yok.');
      setAuthorized(true);
      setDoctorCount((doctors.doctors || []).length);
      setAppointments((booking.appointments || []).map(a => ({
        id: a.id,
        patient: a.patient_name,
        doctor: a.doctor_name,
        department: '—',
        date: new Date(a.starts_at).toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' }),
        time: new Date(a.starts_at).toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' }),
        status: a.status
      })));
    }).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id, action) => {
    const token = getSession()?.token;
    if (!token) return alert('Yeniden giriş yapın.');
    try {
      const response = await apiFetch(`/api/appointments/${id}/${action}`, {
        method: 'PATCH', token
      });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: response.appointment.status } : a));
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {loading && <p role="status">Veriler yükleniyor...</p>}
        {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}
        {/* عنوان اللوحة */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        </div>

        {/* البطاقات الإحصائية (Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Toplam Randevu</p>
              <h3 className="text-2xl font-bold text-gray-800">{authorized ? appointments.length : "—"}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-[#6b8bc4] rounded-lg flex items-center justify-center font-bold text-xl">📅</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Aktif Doktorlar</p>
              <h3 className="text-2xl font-bold text-gray-800">{authorized ? doctorCount : "—"}</h3>
            </div>
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center font-bold text-xl">👨‍⚕️</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Kayıtlı Hastalar</p>
              <h3 className="text-2xl font-bold text-gray-800">—</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-bold text-xl">👥</div>
          </div>
        </div>

        {/* جدول إدارة المواعيد */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">Son Randevu Talepleri</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4">Hasta Adı</th>
                  <th className="p-4">Poliklinik</th>
                  <th className="p-4">Doktor</th>
                  <th className="p-4">Tarih & Saat</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {appointments.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-medium">{item.patient}</td>
                    <td className="p-4">{item.department}</td>
                    <td className="p-4">{item.doctor}</td>
                    <td className="p-4">{item.date} - {item.time}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status === 'BOOKED' ? 'Beklemede' : item.status === 'COMPLETED' ? 'Tamamlandı' : 'İptal Edildi'}
                      </span>
                    </td>
                    <td className="p-4 text-center flex justify-center gap-2">
                      <button 
                        onClick={() => handleStatusChange(item.id, 'complete')}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs"
                      >
                        Tamamla
                      </button>
                      <button 
                        onClick={() => handleStatusChange(item.id, 'cancel')}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs"
                      >
                        İptal
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}