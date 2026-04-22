'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function SuggestionsSection({ ubicacion, excluir }) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState('');

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/sugerencias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ubicacion, excluir })
      });
      const data = await res.json();
      if (res.ok) {
        setSuggestions(data.sugerencias);
      } else {
        setError(data.Error || 'Error al obtener sugerencias');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-8 bg-card border border-border rounded-2xl p-6">
      <h3 className="font-bold text-sage mb-1">¿Quieres más planes cerca?</h3>
      <p className="text-sage-dim text-sm mb-4">
        Sugerencias generadas con IA según la ubicación de este plan
      </p>

      {!suggestions && !loading && (
        <button
          onClick={fetchSuggestions}
          className="inline-flex items-center gap-2 bg-sage/15 text-sage border border-sage/30 px-4 py-2.5 rounded-lg font-medium hover:bg-sage/25 transition cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Descubrir planes cerca
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sage-dim" role="status" aria-live="polite">
          <div className="animate-spin w-4 h-4 border-2 border-sage border-t-transparent rounded-full" />
          <span>Pensando ideas...</span>
        </div>
      )}

      {error && (
        <div role="alert" className="bg-red-900/30 text-red-400 border border-red-800/50 text-sm px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div key={i} className="bg-surface border border-border/50 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h4 className="font-semibold text-light">{s.titulo}</h4>
                <span className="text-xs text-sage-dim shrink-0 whitespace-nowrap bg-sage/10 px-2 py-0.5 rounded-full">
                  {s.distancia}
                </span>
              </div>
              <p className="text-sm text-sage-dim">{s.descripcion}</p>
            </div>
          ))}
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="text-sm text-sage-dim hover:text-sage transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 mt-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Generar otras sugerencias
          </button>
        </div>
      )}

      {suggestions && suggestions.length === 0 && (
        <p className="text-sage-dim text-sm">No se encontraron sugerencias.</p>
      )}
    </section>
  );
}
