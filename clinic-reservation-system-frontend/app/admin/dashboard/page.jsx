"use client";

import { useEffect, useState } from "react";
import Admin_Navbar from "@/components/Admin_Navbar";
import Footer from "@/components/Footer";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/auth";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("sv-SE", {
    timeZone: "Europe/Istanbul",
  });

const formatTime = (value) =>
  new Date(value).toLocaleTimeString("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      const session = getSession();

      if (!session?.token) {
        if (active) {
          setError("Lütfen yönetici hesabıyla giriş yapın.");
          setLoading(false);
        }
        return;
      }

      try {
        const me = await apiFetch("/api/auth/me", {
          token: session.token,
        });

        if (me.user?.role !== "ADMIN") {
          throw new Error("Bu sayfayı görüntüleme yetkiniz yok.");
        }

        const [bookingData, statsData] = await Promise.all([
          apiFetch("/api/appointments", {
            token: session.token,
          }),
          apiFetch("/api/auth/stats", {
            token: session.token,
          }),
        ]);

        if (!active) return;

        const list = Array.isArray(bookingData.appointments)
          ? bookingData.appointments
          : [];

        setAppointments(
          list.map((app) => ({
            id: app.id,
            patient: app.patient_name,
            doctor: app.doctor_name,
            department: "—",
            date: formatDate(app.starts_at),
            time: formatTime(app.starts_at),
            status: app.status,
          })),
        );

        setStats(statsData.stats);
        setAuthorized(true);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleStatusChange = async (id, action) => {
    if (processingId !== null) return;

    const token = getSession()?.token;

    if (!token) {
      alert("Yeniden giriş yapın.");
      return;
    }

    setProcessingId(id);

    try {
      const response = await apiFetch(`/api/appointments/${id}/${action}`, {
        method: "PATCH",
        token,
      });

      setAppointments((previous) =>
        previous.map((app) =>
          String(app.id) === String(id)
            ? {
                ...app,
                status: response.appointment.status,
              }
            : app,
        ),
      );
    } catch (err) {
      alert(err.message || "Güncelleme başarısız.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Admin_Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {loading && <p role="status">Veriler yükleniyor...</p>}

        {error && (
          <p role="alert" className="mb-4 text-red-600">
            {error}
          </p>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Toplam Randevu</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {authorized ? stats?.total_appointments : "—"}
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-[#6b8bc4] rounded-lg flex items-center justify-center font-bold text-xl">
              📅
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Aktif Doktorlar</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {authorized ? stats?.active_doctors : "—"}
              </h3>
            </div>
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center font-bold text-xl">
              👨‍⚕️
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Kayıtlı Hastalar</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {authorized ? stats?.total_patients : "—"}
              </h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-bold text-xl">
              👥
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">
              Son Randevu Talepleri
            </h3>
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

                    <td className="p-4">
                      {item.date} - {item.time}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : item.status === "CANCELLED"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {item.status === "BOOKED"
                          ? "Beklemede"
                          : item.status === "COMPLETED"
                            ? "Tamamlandı"
                            : "İptal Edildi"}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      {item.status === "BOOKED" && (
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            disabled={processingId !== null}
                            onClick={() =>
                              handleStatusChange(item.id, "complete")
                            }
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs disabled:opacity-50"
                          >
                            Tamamla
                          </button>

                          <button
                            type="button"
                            disabled={processingId !== null}
                            onClick={() =>
                              handleStatusChange(item.id, "cancel")
                            }
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs disabled:opacity-50"
                          >
                            İptal
                          </button>
                        </div>
                      )}
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
