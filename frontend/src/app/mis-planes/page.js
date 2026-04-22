'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { SignInButton } from '@clerk/nextjs';
import CalendarGrid from '@/components/CalendarGrid';
import DayDetail from '@/components/DayDetail';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function MisPlanesPage() {
  const { isSignedIn, getToken } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/mis-planes?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      setSelectedDay(null);
      fetchPlans();
    }
  }, [isSignedIn, year, month]);

  const handlePrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleRemove = async (id) => {
    if (!confirm('¿Desmarcar este plan como realizado?')) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/mis-planes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPlans(prev => prev.filter(p => p.id !== id));
      }
    } catch {
      alert('Error al desmarcar');
    }
  };

  // Planes del día seleccionado
  const dayPlans = selectedDay
    ? plans.filter(p => new Date(p.fecha).getDate() === selectedDay)
    : [];

  // Resumen del mes
  const totalPlans = plans.length;
  const daysWithPlans = new Set(plans.map(p => new Date(p.fecha).getDate())).size;

  if (!isSignedIn) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4" aria-hidden="true">📅</p>
        <p className="text-sage text-lg mb-2">Inicia sesión para ver tus planes</p>
        <p className="text-sage-dim text-sm mb-6">Lleva un registro de los planes que has realizado</p>
        <SignInButton mode="modal">
          <button className="bg-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-accent-light transition cursor-pointer">
            Iniciar sesión
          </button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-logo text-3xl tracking-wide text-sage">MIS PLANES</h1>
      </div>

      {/* Resumen del mes */}
      {!loading && totalPlans > 0 && (
        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-sage">{totalPlans}</p>
            <p className="text-xs text-sage-dim mt-1">plan{totalPlans > 1 ? 'es' : ''} realizado{totalPlans > 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-sage">{daysWithPlans}</p>
            <p className="text-xs text-sage-dim mt-1">día{daysWithPlans > 1 ? 's' : ''} activo{daysWithPlans > 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
          <div className="h-6 bg-surface rounded w-40 mx-auto mb-4" />
          <div className="grid grid-cols-7 gap-1">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-12 bg-surface rounded-lg" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <CalendarGrid
            year={year}
            month={month}
            plans={plans}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />

          <DayDetail
            day={selectedDay}
            month={month}
            year={year}
            plans={dayPlans}
            onRemove={handleRemove}
          />

          {totalPlans === 0 && (
            <div className="text-center py-10">
              <p className="text-sage-dim">No tienes planes registrados este mes</p>
              <Link href="/planes" className="text-sage hover:underline text-sm mt-2 inline-block transition">
                Explorar planes →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
