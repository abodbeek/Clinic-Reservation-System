"use client";

import { useEffect, useState, useCallback } from "react";
import Footer from "@/components/Footer";
import Doctor_Navbar from "@/components/Doctor_Navbar";
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

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState("Doktor");
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchDoctorAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const session = getSession();

      if (!session?.token) {
        throw new Error("Lütfen doktor hesabınızla giriş yapın.");
      }

      const me = await apiFetch("/api/auth/me", {
        token: session.token,
      });

      if (me.user?.role !== "DOCTOR") {
        throw new Error("Bu sayfa sadece doktorlar içindir.");
      }

      setDoctorName(me.user.full_name || "Doktor");

      const data = await apiFetch("/api/appointments/doctor", {
        token: session.token,
      });

      setAppointments(
        Array.isArray(data.appointments) ? data.appointments : [],
      );
    } catch (err) {
      console.error("Doktor randevu hatası:", err);
      setAppointments([]);
      setError(err.message || "Randevular alınamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetchDoctorAppointments);
  }, [fetchDoctorAppointments]);

  const handleCompleteAppointment = async (id) => {
    if (processingId !== null) return;

    const token = getSession()?.token;

    if (!token) {
      alert("Lütfen yeniden giriş yapın.");
      return;
    }

    setProcessingId(id);

    try {
      await apiFetch(`/api/appointments/${id}/complete`, {
        method: "PATCH",
        token,
      });

      alert("Randevu tamamlandı olarak işaretlendi!");
      await fetchDoctorAppointments();
    } catch (err) {
      alert(err.message || "İşlem başarısız.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Doctor_Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-gray-800">
            Hoş geldiniz, <span className="text-[#6b8bc4]">{doctorName}</span>{" "}
            👋
          </h1>

          <p className="text-gray-600">
            Size alınan randevuları görüntüleyebilir ve tamamlananları
            işaretleyebilirsiniz.
          </p>
        </div>

        {error && (
          <p role="alert" className="mb-4 text-red-600">
            {error}
          </p>
        )}

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
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">
                      Kayıtlı randevunuz bulunmamaktadır.
                    </td>
                  </tr>
                ) : (
                  appointments.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium">{app.id}</td>

                      <td className="p-4 font-medium text-gray-900">
                        {app.patient_name || "Hasta"}
                      </td>

                      <td className="p-4 text-gray-600">
                        {formatTime(app.starts_at)}
                      </td>

                      <td className="p-4 text-gray-500">{app.reason || "-"}</td>

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
                          <button
                            type="button"
                            disabled={processingId !== null}
                            onClick={() => handleCompleteAppointment(app.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs font-semibold disabled:opacity-50"
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
