'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { apiFetch } from '@/lib/api';
import { getSession } from '@/lib/auth';

export default function AppointmentPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    department: '',
    doctor: '',
    date: '',
    time: '',
    notes: '',
  });

  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    apiFetch('/api/doctors')
      .then(data => { if (active) setDoctors(data.doctors || []); })
      .catch(err => alert(err.message))
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const doctor = new URLSearchParams(window.location.search).get('doctor');
    if (doctor) setFormData(prev => ({ ...prev, doctor }));
  }, []);

  useEffect(() => {
    if (!formData.doctor || !formData.date) { setSlots([]); return; }
    let active = true;
    setLoadingSlots(true);
    apiFetch(`/api/doctors/${encodeURIComponent(formData.doctor)}/availability?date=${encodeURIComponent(formData.date)}`)
      .then(data => { if (active) setSlots(data.slots || []); })
      .catch(err => { if (active) { setSlots([]); alert(err.message); } })
      .finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [formData.doctor, formData.date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev, [name]: value,
      ...(name === 'department' ? { doctor: '', time: '', date: '' } : {}),
      ...(name === 'doctor' || name === 'date' ? { time: '' } : {})
    }));
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    const session = getSession();
    if (!session?.token || session.user?.role !== 'PATIENT') {
      alert('Randevu almak için hasta hesabıyla giriş yapın.');
      return;
    }
    if (!formData.time || !slots.includes(formData.time)) {
      alert('Lütfen uygun bir randevu saati seçin.');
      return;
    }
    setBusy(true);
    try {
      await apiFetch('/api/appointments', {
        method: 'POST', token: session.token,
        body: JSON.stringify({
          doctor_id: Number(formData.doctor),
          date: formData.date,
          time: formData.time,
          reason: formData.notes.trim() || null
        })
      });
      alert('Randevunuz başarıyla oluşturuldu!');
      setSlots(prev => prev.filter(slot => slot !== formData.time));
      setFormData(prev => ({ ...prev, time: '', notes: '' }));
    } catch (err) {
      if (err.status === 409) alert('Bu saat dolu. Lütfen başka bir saat seçin.');
      else alert(err.message || 'Randevu oluşturulamadı.');
    } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[url('/login_images/background.jpg')] bg-cover bg-center">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={handleAppointmentSubmit} className="bg-white/95 p-8 rounded-xl shadow-lg max-w-lg w-full">
          <img src="/Randevu_Al_Images/randevu_logo.png" alt="Appointment" className="w-50 h-50 mx-auto" />
          <h2 className="text-4xl font-bold m-6 text-center text-gray-800">Randevu Al</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
            <input 
              type="text" 
              name="fullName"
              placeholder="Adınızı ve soyadınızı giriniz" 
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon Numarası</label>
            <input 
              type="tel" 
              name="phone"
              placeholder="05XXXXXXXXX" 
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Poliklinik (Bölüm)</label>
            <select 
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]"
            >
              <option value="">Poliklinik Seçiniz</option>
              {[...new Set(doctors.map(d => d.specialty))].map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Doktor</label>
            <select 
              name="doctor"
              value={formData.doctor}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]"
            >
              <option value="">Doktor Seçiniz</option>
              {doctors.filter(d => !formData.department || d.specialty === formData.department).map(d => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
              <input 
                type="date" 
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
              <select name="time" value={formData.time} onChange={handleChange} required disabled={!formData.date || !formData.doctor || loadingSlots} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]">
                <option value="">{loadingSlots ? 'Yükleniyor...' : 'Saat Seçiniz'}</option>
                {slots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Şikayet / Notlar (İsteğe bağlı)</label>
            <textarea 
            name="notes"
                placeholder="Belirtmek istediğiniz bir şikayetiniz var mı?"
                value={formData.notes}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6b8bc4] resize-none h-24"
            ></textarea>
          </div>

          <button type="submit" disabled={busy} className="w-full bg-[#6b8bc4] text-white p-3 rounded-lg font-semibold hover:bg-[#3c4e6e] transition shadow-md">
            Randevuyu Onayla
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}