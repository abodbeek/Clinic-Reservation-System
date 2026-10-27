"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/auth";

export default function AppointmentPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    department: "",
    doctor: "",
    date: "",
    time: "",
    notes: "",
  });

  const [doctors, setDoctors] = useState([]);

  const [availability, setAvailability] = useState({
    key: "",
    slots: [],
  });

  const [nameFromAccount, setNameFromAccount] = useState(false);
  const [busy, setBusy] = useState(false);

  // Identify which doctor's slots are currently requested
  const selectionKey =
    formData.doctor && formData.date
      ? `${formData.doctor}:${formData.date}`
      : "";

  const slots =
    selectionKey && availability.key === selectionKey ? availability.slots : [];

  const loadingSlots = Boolean(
    selectionKey && availability.key !== selectionKey,
  );

  // ========================================
  // Load doctors and preselect doctor from URL
  // ========================================

  useEffect(() => {
    let active = true;

    const user = getSession()?.user;

    const doctorIdFromUrl = new URLSearchParams(window.location.search).get(
      "doctor",
    );

    apiFetch("/api/doctors")
      .then((data) => {
        if (!active) return;

        const list = Array.isArray(data.doctors) ? data.doctors : [];

        setDoctors(list);

        const selectedDoctor = list.find(
          (doctor) => String(doctor.id) === doctorIdFromUrl,
        );

        setFormData((previous) => ({
          ...previous,

          fullName:
            user?.role === "PATIENT" && user.full_name
              ? user.full_name
              : previous.fullName,

          ...(selectedDoctor
            ? {
                doctor: String(selectedDoctor.id),
                department: selectedDoctor.specialty,
              }
            : {}),
        }));

        if (user?.role === "PATIENT" && user.full_name) {
          setNameFromAccount(true);
        }
      })

      .catch((error) => {
        if (active) {
          alert(error.message || "Doktorlar yüklenemedi.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // ========================================
  // Load available appointment times
  // ========================================

  useEffect(() => {
    if (!selectionKey) return;

    let active = true;

    apiFetch(
      `/api/doctors/${encodeURIComponent(
        formData.doctor,
      )}/availability?date=${encodeURIComponent(formData.date)}`,
    )
      .then((data) => {
        if (!active) return;

        setAvailability({
          key: selectionKey,
          slots: Array.isArray(data.slots) ? data.slots : [],
        });
      })

      .catch((error) => {
        if (!active) return;

        setAvailability({
          key: selectionKey,
          slots: [],
        });

        alert(error.message || "Uygun saatler alınamadı.");
      });

    return () => {
      active = false;
    };
  }, [selectionKey, formData.doctor, formData.date]);

  // ========================================
  // Handle form field changes
  // ========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,

      [name]: value,

      ...(name === "department"
        ? {
            doctor: "",
            date: "",
            time: "",
          }
        : {}),

      ...(name === "doctor" || name === "date" ? { time: "" } : {}),
    }));

    if (name === "department" || name === "doctor" || name === "date") {
      setAvailability({
        key: "",
        slots: [],
      });
    }
  };

  // ========================================
  // Create Appointment
  // ========================================

  const handleAppointmentSubmit = async (event) => {
    event.preventDefault();

    if (busy) return;

    const session = getSession();

    // Only PATIENT can book
    if (!session?.token || session.user?.role !== "PATIENT") {
      alert("Randevu almak için hasta hesabıyla giriş yapın.");
      return;
    }

    // Validate patient name
    if (!formData.fullName.trim()) {
      alert("Lütfen adınızı ve soyadınızı kontrol edin.");
      return;
    }

    // Validate phone number
    if (!/^[0-9+()\s-]{10,25}$/.test(formData.phone.trim())) {
      alert("Lütfen geçerli bir telefon numarası girin.");
      return;
    }

    // Verify selected time
    if (!formData.time || !slots.includes(formData.time)) {
      alert("Lütfen uygun bir randevu saati seçin.");
      return;
    }

    setBusy(true);

    try {
      await apiFetch("/api/appointments", {
        method: "POST",

        token: session.token,

        body: JSON.stringify({
          doctor_id: Number(formData.doctor),
          date: formData.date,
          time: formData.time,
          reason: formData.notes.trim() || null,
          contact_phone: formData.phone.trim(),
        }),
      });

      alert("Randevunuz başarıyla oluşturuldu!");

      // Remove booked slot from available times
      setAvailability((previous) => ({
        ...previous,

        slots:
          previous.key === selectionKey
            ? previous.slots.filter((slot) => slot !== formData.time)
            : previous.slots,
      }));

      // Clear appointment time and notes
      setFormData((previous) => ({
        ...previous,
        time: "",
        notes: "",
      }));
    } catch (error) {
      if (error.status === 409) {
        alert("Bu saat dolu. Lütfen başka bir saat seçin.");
      } else {
        alert(error.message || "Randevu oluşturulamadı.");
      }
    } finally {
      setBusy(false);
    }
  };

  // ========================================
  // Appointment Page UI
  // Original design preserved
  // ========================================

  return (
    <div className="flex flex-col min-h-screen bg-[url('/login_images/background.jpg')] bg-cover bg-center">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6">
        <form
          onSubmit={handleAppointmentSubmit}
          className="bg-white/95 p-8 rounded-xl shadow-lg max-w-lg w-full"
        >
          <img
            src="/Randevu_Al_Images/randevu_logo.png"
            alt="Appointment"
            className="w-50 h-50 mx-auto"
          />

          <h2 className="text-4xl font-bold m-6 text-center text-gray-800">
            Randevu Al
          </h2>

          {/* Full Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ad Soyad
            </label>

            <input
              type="text"
              name="fullName"
              placeholder="Adınızı ve soyadınızı giriniz"
              value={formData.fullName}
              onChange={handleChange}
              readOnly={nameFromAccount}
              required
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]"
            />
          </div>

          {/* Phone Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon Numarası
            </label>

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

          {/* Department */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poliklinik (Bölüm)
            </label>

            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]"
            >
              <option value="">Poliklinik Seçiniz</option>

              {[...new Set(doctors.map((d) => d.specialty))].map(
                (specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* Doctor */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Doktor
            </label>

            <select
              name="doctor"
              value={formData.doctor}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]"
            >
              <option value="">Doktor Seçiniz</option>

              {doctors
                .filter(
                  (doctor) =>
                    !formData.department ||
                    doctor.specialty === formData.department,
                )
                .map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.full_name}
                  </option>
                ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tarih
              </label>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Saat
              </label>

              <select
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                disabled={!formData.date || !formData.doctor || loadingSlots}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6b8bc4]"
              >
                <option value="">
                  {loadingSlots ? "Yükleniyor..." : "Saat Seçiniz"}
                </option>

                {slots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Şikayet / Notlar (İsteğe bağlı)
            </label>

            <textarea
              name="notes"
              placeholder="Belirtmek istediğiniz bir şikayetiniz var mı?"
              value={formData.notes}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#6b8bc4] resize-none h-24"
            ></textarea>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[#6b8bc4] text-white p-3 rounded-lg font-semibold hover:bg-[#3c4e6e] transition shadow-md"
          >
            Randevuyu Onayla
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
