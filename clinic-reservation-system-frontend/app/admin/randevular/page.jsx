'use client';
import { useState, useEffect } from 'react';
import Admin_Navbar from '@/components/Admin_Navbar';
import Footer from '@/components/Footer';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return '';
    const sessionData = localStorage.getItem('clinic_auth') || sessionStorage.getItem('clinic_auth');
    if (!sessionData) return '';
    try {
      const parsed = JSON.parse(sessionData);
      return parsed.token || '';
    } catch (e) {
      return sessionData;
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:5000/api/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : data.appointments || []);
      }
    } catch (error) {
      console.error("Randevular yüklenirken hata oluştu:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // تعديل حالة الموعد (إلغاء أو إكمال حسب مسارات الباك إند)
  const handleUpdateStatus = async (id, actionType) => {
    // actionType يا إما 'cancel' أو 'complete'
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:5000/api/appointments/${id}/${actionType}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert("Randevu durumu güncellendi!");
        fetchAppointments();
      } else {
        const err = await response.json();
        alert(err.message || "Güncelleme başarısız.");
      }
    } catch (error) {
      console.error("Hata:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Admin_Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Randevu Yönetimi</h1>
          <p className="text-gray-600">Sistemdeki tüm randevuları görüntüleyebilir ve yönetebilirsiniz.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">Randevular Listesi</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4">ID</th>
                  <th className="p-4">Hasta Adı</th>
                  <th className="p-4">Doktor</th>
                  <th className="p-4">Tarih ve Saat</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr><td colSpan="6" className="p-4 text-center text-gray-500">Yükleniyor...</td></tr>
                ) : appointments.length === 0 ? (
                  <tr><td colSpan="6" className="p-4 text-center text-gray-500">Kayıtlı randevu bulunamadı.</td></tr>
                ) : (
                  appointments.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium">{app.id}</td>
                      <td className="p-4 font-medium text-gray-900">{app.patient_name || 'Hasta'}</td>
                      <td className="p-4 font-semibold text-[#6b8bc4]">{app.doctor_name || 'Doktor'}</td>
                      <td className="p-4 text-gray-600">
                        {app.starts_at ? new Date(app.starts_at).toLocaleString() : '-'}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          app.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {app.status || 'BOOKED'}
                        </span>
                      </td>
                      <td className="p-4 text-center flex justify-center gap-2">
                        <button 
                          onClick={() => handleUpdateStatus(app.id, 'complete')}
                          className="px-2.5 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs"
                        >
                          Tamاملا (Complete)
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(app.id, 'cancel')}
                          className="px-2.5 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition text-xs"
                        >
                          İptal Et
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}