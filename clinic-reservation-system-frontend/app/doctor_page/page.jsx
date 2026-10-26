'use client';
import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import Doctor_Navbar from '@/components/Doctor_Navbar';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState('Doktor');

  useEffect(() => {
    const sessionData = localStorage.getItem('clinic_auth') || sessionStorage.getItem('clinic_auth');
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.user && parsed.user.full_name) {
          setDoctorName(parsed.user.full_name);
        }
      } catch (e) {
        console.error("Kullanıcı bilgisi okunamadı", e);
      }
    }

    fetchDoctorAppointments();
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

  const fetchDoctorAppointments = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:5000/api/appointments/doctor', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : data.doctors || data.appointments || []);
      }
    } catch (error) {
      console.error("Randevular yüklenirken hata oluştu:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAppointment = async (id) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:5000/api/appointments/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert("Randevu tamamlandı olarak işaretlendi!");
        fetchDoctorAppointments();
      } else {
        const err = await response.json();
        alert(err.message || "İşlem başarısız.");
      }
    } catch (error) {
      console.error("Hata:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <Doctor_Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* عبارة الترحيب واسم الدكتور */}
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-gray-800">
            Hoş geldiniz, dr. <span className="text-[#6b8bc4]">{doctorName}</span> 👋
          </h1>
          <p className="text-gray-600">Size alınan randevuları görüntüleyebilir ve tamamlananları işaretleyebilirsiniz.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">Randevularım</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4">ID</th>
                  <th className="p-4">Hasta Adı</th>
                  <th className="p-4">Tarih ve Saat</th>
                  <th className="p-4">Şikayet / Sebep</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr><td colSpan="6" className="p-4 text-center text-gray-500">Yükleniyor...</td></tr>
                ) : appointments.length === 0 ? (
                  <tr><td colSpan="6" className="p-4 text-center text-gray-500">Kayıtlı randevunuz bulunmamaktadır.</td></tr>
                ) : (
                  appointments.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium">{app.id}</td>
                      <td className="p-4 font-medium text-gray-900">{app.patient_name || 'Hasta'}</td>
                      <td className="p-4 text-gray-600">
                        {app.starts_at ? new Date(app.starts_at).toLocaleString() : '-'}
                      </td>
                      <td className="p-4 text-gray-500">{app.reason || '-'}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          app.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {app.status || 'BOOKED'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {app.status === 'BOOKED' && (
                          <button 
                            onClick={() => handleCompleteAppointment(app.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs font-semibold"
                          >
                            Tamamla (Complete)
                          </button>
                        )}
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