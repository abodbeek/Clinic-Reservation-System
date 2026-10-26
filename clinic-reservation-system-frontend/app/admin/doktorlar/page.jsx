'use client';
import { useState, useEffect } from 'react';
import Admin_Navbar from '@/components/Admin_Navbar';
import Footer from '@/components/Footer';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Pazartesi' },
  { id: 2, name: 'Salı' },
  { id: 3, name: 'Çarşamba' },
  { id: 4, name: 'Perşembe' },
  { id: 5, name: 'Cuma' },
  { id: 6, name: 'Cumartesi' },
  { id: 0, name: 'Pazar' },
];

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // حقول نموذج إضافة طبيب جديد
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [biography, setBiography] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // جدول المواعيد الافتراضي أثناء إنشاء الطبيب (أيام العمل المحددة)
  const [schedule, setSchedule] = useState([
    { day_of_week: 1, start_time: '09:00', end_time: '17:00', active: true },
    { day_of_week: 2, start_time: '09:00', end_time: '17:00', active: true },
    { day_of_week: 3, start_time: '09:00', end_time: '17:00', active: true },
    { day_of_week: 4, start_time: '09:00', end_time: '17:00', active: true },
    { day_of_week: 5, start_time: '09:00', end_time: '17:00', active: true },
    { day_of_week: 6, start_time: '09:00', end_time: '13:00', active: false },
    { day_of_week: 0, start_time: '09:00', end_time: '13:00', active: false },
  ]);

  // حالة لوحة تعديل أوقات طبيب موجود
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editSchedule, setEditSchedule] = useState([]);

  useEffect(() => {
    fetchDoctors();
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

  const fetchDoctors = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:5000/api/doctors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(Array.isArray(data) ? data : data.doctors || []);
      }
    } catch (error) {
      console.error("Doktorлар yüklenirken hata oluştu:", error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (index, field, value, isEditing = false) => {
    if (isEditing) {
      const updated = [...editSchedule];
      updated[index][field] = value;
      setEditSchedule(updated);
    } else {
      const updated = [...schedule];
      updated[index][field] = value;
      setSchedule(updated);
    }
  };

  // إضافة طبيب جديد مع جدوله الزمني
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      alert("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    const token = getAuthToken();
    const activeSchedule = schedule
      .filter(s => s.active)
      .map(({ day_of_week, start_time, end_time }) => ({ day_of_week, start_time, end_time }));

    try {
      const response = await fetch('http://localhost:5000/api/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          specialty,
          biography,
          image_url: imageUrl
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newDoctorId = data.doctor?.id;

        // إذا تم إنشاء الدكتور بنجاح، نقوم بإرسال جدوله الزمني
        if (newDoctorId && activeSchedule.length > 0) {
          await fetch(`http://localhost:5000/api/doctors/${newDoctorId}/schedule`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ schedule: activeSchedule })
          });
        }

        alert("Doktor ve çalışma saatleri başarıyla eklendi!");
        setFullName('');
        setEmail('');
        setPassword('');
        setSpecialty('');
        setBiography('');
        setImageUrl('');
        fetchDoctors();
      } else {
        const errData = await response.json();
        alert(errData.message || "Doktor eklenirken hata oluştu.");
      }
    } catch (error) {
      console.error("Bağlantı hatası:", error);
    }
  };

  // فتح نافذة تعديل أوقات الطبيب
  const openEditScheduleModal = async (doc) => {
    setEditingDoctor(doc);
    try {
      const response = await fetch(`http://localhost:5000/api/doctors/${doc.id}/schedule`);
      if (response.ok) {
        const data = await response.json();
        const existing = data.schedule || [];
        
        // تجهيز الـ 7 أيام
        const fullWeek = DAYS_OF_WEEK.map(d => {
          const found = existing.find(e => e.day_of_week === d.id);
          return {
            day_of_week: d.id,
            start_time: found ? found.start_time : '09:00',
            end_time: found ? found.end_time : '17:00',
            active: !!found
          };
        });
        setEditSchedule(fullWeek);
      }
    } catch (err) {
      console.error("Çalışma saatleri alınamadı", err);
    }
  };

  // حفظ التعديلات على جدول الطبيب
  const handleSaveScheduleUpdate = async () => {
    const token = getAuthToken();
    const activeSchedule = editSchedule
      .filter(s => s.active)
      .map(({ day_of_week, start_time, end_time }) => ({ day_of_week, start_time, end_time }));

    try {
      const response = await fetch(`http://localhost:5000/api/doctors/${editingDoctor.id}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ schedule: activeSchedule })
      });

      if (response.ok) {
        alert("Çalışma saatleri güncellendi!");
        setEditingDoctor(null);
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
          <h1 className="text-3xl font-bold text-gray-800">Doktor Yönetimi</h1>
          <p className="text-gray-600">Sisteme yeni doktor ekleyebilir ve çalışma saatlerini düzenleyebilirsiniz.</p>
        </div>

        {/* نموذج إضافة طبيب جديد مع جدول الساعات */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-10">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Yeni Doktor Ekle</h3>
          <form onSubmit={handleAddDoctor} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input 
                type="text" placeholder="Doktor Adı Soyadı" value={fullName}
                onChange={(e) => setFullName(e.target.value)} required
                className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]"
              />
              <input 
                type="email" placeholder="E-posta Adresi" value={email}
                onChange={(e) => setEmail(e.target.value)} required
                className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]"
              />
              <input 
                type="password" placeholder="Geçici Şifre (En az 8 karakter)" value={password}
                onChange={(e) => setPassword(e.target.value)} required minLength={8}
                className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]"
              />
              <input 
                type="text" placeholder="Uzmanlık Alanı" value={specialty}
                onChange={(e) => setSpecialty(e.target.value)} required
                className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]"
              />
              <input 
                type="text" placeholder="Fotoğraf Linki (Image URL)" value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]"
              />
              <input 
                type="text" placeholder="Biyografi (Kısa bilgi)" value={biography}
                onChange={(e) => setBiography(e.target.value)}
                className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]"
              />
            </div>

            {/* تحديد ساعات العمل الأسبوعية للإضافة */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-700 mb-3">Çalışma Saatleri (Haftalık Müsaitlik)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {schedule.map((item, idx) => {
                  const dayName = DAYS_OF_WEEK.find(d => d.id === item.day_of_week)?.name;
                  return (
                    <div key={item.day_of_week} className="p-3 border rounded-lg bg-gray-50 flex flex-col gap-2">
                      <label className="flex items-center gap-2 font-medium text-sm text-gray-800">
                        <input 
                          type="checkbox" checked={item.active}
                          onChange={(e) => handleScheduleChange(idx, 'active', e.target.checked)}
                        />
                        {dayName}
                      </label>
                      {item.active && (
                        <div className="flex items-center gap-2 text-xs">
                          <input 
                            type="time" value={item.start_time}
                            onChange={(e) => handleScheduleChange(idx, 'start_time', e.target.value)}
                            className="p-1 border rounded bg-white"
                          />
                          <span>-</span>
                          <input 
                            type="time" value={item.end_time}
                            onChange={(e) => handleScheduleChange(idx, 'end_time', e.target.value)}
                            className="p-1 border rounded bg-white"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-[#6b8bc4] text-white py-2 rounded-lg hover:bg-[#3c4e6e] transition font-semibold"
            >
              Doktoru ve Saatleri Kaydet
            </button>
          </form>
        </div>

        {/* جدول عرض الأطباء */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">Kayıtlı Doktorlar Listesi</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="p-4">ID</th>
                  <th className="p-4">Fotoğraf</th>
                  <th className="p-4">Ad Soyad</th>
                  <th className="p-4">E-posta</th>
                  <th className="p-4">Uzmanlık</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 text-center">Çalışma Saatleri / İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr><td colSpan="7" className="p-4 text-center text-gray-500">Yükleniyor...</td></tr>
                ) : doctors.length === 0 ? (
                  <tr><td colSpan="7" className="p-4 text-center text-gray-500">Kayıtlı doktor bulunamadı.</td></tr>
                ) : (
                  doctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium">{doc.id}</td>
                      <td className="p-4">
                        <img 
                          src={doc.image_url || '/login_images/logo.png'} 
                          alt="Doctor" 
                          className="w-10 h-10 rounded-full object-cover border"
                        />
                      </td>
                      <td className="p-4 font-medium">{doc.full_name || 'Doktor'}</td>
                      <td className="p-4 text-gray-500">{doc.email}</td>
                      <td className="p-4 font-semibold text-[#6b8bc4]">{doc.specialty}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          doc.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {doc.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => openEditScheduleModal(doc)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-semibold"
                        >
                          Saatleri Düzenle
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

      {/* نافذة منبثقة (Modal) لتعديل ساعات الطبيب */}
      {editingDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-2xl w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Çalışma Saatlerini Düzenle: {editingDoctor.full_name}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto mb-6 p-2">
              {editSchedule.map((item, idx) => {
                const dayName = DAYS_OF_WEEK.find(d => d.id === item.day_of_week)?.name;
                return (
                  <div key={item.day_of_week} className="p-3 border rounded-lg bg-gray-50 flex flex-col gap-2">
                    <label className="flex items-center gap-2 font-medium text-sm text-gray-800">
                      <input 
                        type="checkbox" checked={item.active}
                        onChange={(e) => handleScheduleChange(idx, 'active', e.target.checked, true)}
                      />
                      {dayName}
                    </label>
                    {item.active && (
                      <div className="flex items-center gap-2 text-xs">
                        <input 
                          type="time" value={item.start_time}
                          onChange={(e) => handleScheduleChange(idx, 'start_time', e.target.value, true)}
                          className="p-1 border rounded bg-white"
                        />
                        <span>-</span>
                        <input 
                          type="time" value={item.end_time}
                          onChange={(e) => handleScheduleChange(idx, 'end_time', e.target.value, true)}
                          className="p-1 border rounded bg-white"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setEditingDoctor(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition text-sm"
              >
                İptal
              </button>
              <button 
                onClick={handleSaveScheduleUpdate}
                className="px-4 py-2 bg-[#6b8bc4] text-white rounded-lg hover:bg-[#3c4e6e] transition text-sm font-semibold"
              >
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}