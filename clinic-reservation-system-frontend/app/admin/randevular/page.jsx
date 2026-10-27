"use client";

import { useState, useEffect, useCallback } from "react";
import Admin_Navbar from "@/components/Admin_Navbar";
import Footer from "@/components/Footer";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/auth";

const formatTime = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getSession()?.token;

      if (!token) {
        throw new Error("Lütfen yönetici hesabınızla giriş yapın.");
      }

      const data = await apiFetch("/api/appointments", {
        token,
      });

      setAppointments(
        Array.isArray(data.appointments) ? data.appointments : [],
      );
    } catch (err) {
      console.error("Randevu yükleme hatası:", err);
      setAppointments([]);
      setError(err.message || "Randevular yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetchAppointments);
  }, [fetchAppointments]);

  const handleUpdateStatus = async (id, actionType) => {
    if (processingId !== null) return;

    const token = getSession()?.token;

    if (!token) {
      alert("Lütfen yeniden giriş yapın.");
      return;
    }

    setProcessingId(id);

    try {
      await apiFetch(`/api/appointments/${id}/${actionType}`, {
        method: "PATCH",
        token,
      });

      alert("Randevu durumu güncellendi!");
      await fetchAppointments();
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Randevu Yönetimi</h1>
          <p className="text-gray-600">
            Sistemdeki tüm randevuları görüntüleyebilir ve yönetebilirsiniz.
          </p>
        </div>

        {error && (
          <p role="alert" className="mb-4 text-red-600">
            {error}
          </p>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">
              Randevular Listesi
            </h3>
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
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">
                      Kayıtlı randevu bulunamadı.
                    </td>
                  </tr>
                ) : (
                  appointments.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium">{app.id}</td>

                      <td className="p-4 font-medium text-gray-900">
                        {app.patient_name || "Hasta"}
                      </td>

                      <td className="p-4 font-semibold text-[#6b8bc4]">
                        {app.doctor_name || "Doktor"}
                      </td>

                      <td className="p-4 text-gray-600">
                        {formatTime(app.starts_at)}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            app.status === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : app.status === "CANCELLED"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {app.status || "BOOKED"}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        {app.status === "BOOKED" && (
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              disabled={processingId !== null}
                              onClick={() =>
                                handleUpdateStatus(app.id, "complete")
                              }
                              className="px-2.5 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs disabled:opacity-50"
                            >
                              Tamamla
                            </button>

                            <button
                              type="button"
                              disabled={processingId !== null}
                              onClick={() =>
                                handleUpdateStatus(app.id, "cancel")
                              }
                              className="px-2.5 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition text-xs disabled:opacity-50"
                            >
                              İptal Et
                            </button>
                          </div>
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
