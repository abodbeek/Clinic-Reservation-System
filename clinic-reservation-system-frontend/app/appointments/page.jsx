"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/auth";

const localTime = (iso) =>
  new Date(iso).toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      const current = getSession();

      if (!active) return;
      setSession(current);

      if (!current?.token || current.user?.role !== "PATIENT") {
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch("/api/appointments/me", {
          token: current.token,
        });

        if (active) {
          setAppointments(
            Array.isArray(data.appointments) ? data.appointments : [],
          );
        }
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

  const cancel = async (id) => {
    if (processingId !== null) return;

    if (!window.confirm("Randevuyu iptal etmek istiyor musunuz?")) {
      return;
    }

    const token = getSession()?.token;

    if (!token) {
      setError("Lütfen yeniden giriş yapın.");
      return;
    }

    setProcessingId(id);
    setError("");

    try {
      await apiFetch(`/api/appointments/${id}/cancel`, {
        token,
        method: "PATCH",
      });

      setAppointments((items) =>
        items.map((app) =>
          String(app.id) === String(id) ? { ...app, status: "CANCELLED" } : app,
        ),
      );
    } catch (err) {
      setError(err.message || "Randevu iptal edilemedi.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl flex-1 p-6">
        <h1 className="mb-5 text-3xl font-bold">Randevularım</h1>

        {loading && <p>Yükleniyor...</p>}

        {!loading && session?.user?.role !== "PATIENT" && (
          <p>
            Bu sayfaya erişmek için hasta hesabınızla{" "}
            <Link className="text-blue-700 underline" href="/login">
              giriş yapın
            </Link>
            .
          </p>
        )}

        {error && (
          <p role="alert" className="mb-3 text-red-600">
            {error}
          </p>
        )}

        {session?.user?.role === "PATIENT" &&
          !loading &&
          appointments.length === 0 && <p>Henüz randevunuz yok.</p>}

        <div className="space-y-3">
          {appointments.map((app) => (
            <div
              key={app.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-5 shadow-sm"
            >
              <div>
                <h2 className="font-semibold">{app.doctor_name}</h2>

                <p className="text-sm text-gray-600">
                  {localTime(app.starts_at)} — {app.status}
                </p>
              </div>

              {app.status === "BOOKED" && (
                <button
                  type="button"
                  disabled={processingId !== null}
                  className="rounded border border-red-500 px-3 py-2 text-red-700 disabled:opacity-50"
                  onClick={() => cancel(app.id)}
                >
                  İptal Et
                </button>
              )}
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
