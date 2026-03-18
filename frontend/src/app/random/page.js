'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AVAILABLE_TAGS } from '@/components/TagSelector';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const TAG_COLORS = [
  'bg-sage/15 text-sage border-sage/20',
  'bg-emerald-900/40 text-emerald-300 border-emerald-700/30',
  'bg-teal-900/40 text-teal-300 border-teal-700/30',
  'bg-cyan-900/40 text-cyan-300 border-cyan-700/30',
  'bg-green-900/40 text-green-300 border-green-700/30',
  'bg-lime-900/40 text-lime-300 border-lime-700/30',
];

function getTagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export default function RandomPage() {
  const [selectedTags, setSelectedTags] = useState([]);
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [animating, setAnimating] = useState(false);

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const fetchRandom = async () => {
    setLoading(true);
    setNoResults(false);
    setAnimating(true);

    try {
      const params = new URLSearchParams();
      selectedTags.forEach(t => params.append('tag', t));

      const res = await fetch(`${API_URL}/ideasRandom?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTimeout(() => {
          setIdea(data);
          setAnimating(false);
          setLoading(false);
        }, 600);
      } else {
        setIdea(null);
        setNoResults(true);
        setAnimating(false);
        setLoading(false);
      }
    } catch {
      setIdea(null);
      setNoResults(true);
      setAnimating(false);
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!idea) return;
    const url = `${window.location.origin}/idea/${idea.id}`;
    const message = `Hola, me gustaría hacer este plan: ${idea.titulo} 📍 ${idea.ubicacion}\n${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(message);
      alert('Mensaje copiado al portapapeles');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <nav aria-label="Volver al inicio" className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sage-dim hover:text-sage transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>
      </nav>

      <h1 className="font-logo text-4xl tracking-wide text-sage mb-2">PLAN RANDOM</h1>
      <p className="text-sage-dim mb-8">Selecciona etiquetas (opcional) y descubre un plan al azar</p>

      {/* Tag selector */}
      <section className="mb-8" aria-label="Filtrar por etiquetas">
        <h2 className="text-sm font-medium text-sage-dim mb-3">Filtrar por etiquetas</h2>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map(tag => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`text-sm px-3 py-1.5 rounded-full border transition cursor-pointer ${
                  isSelected
                    ? 'bg-sage/25 text-sage border-sage/40 font-medium'
                    : 'bg-card text-sage-dim border-border hover:border-sage/30 hover:text-sage'
                }`}
                aria-pressed={isSelected}
              >
                {tag}
              </button>
            );
          })}
        </div>
        {selectedTags.length > 0 && (
          <button
            onClick={() => setSelectedTags([])}
            className="text-xs text-sage-dim hover:text-sage mt-2 transition cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}
      </section>

      {/* Random button */}
      <button
        onClick={fetchRandom}
        disabled={loading}
        className="w-full bg-accent text-light py-4 rounded-2xl font-bold text-lg hover:bg-accent-light disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-3 mb-8"
      >
        {loading ? (
          <>
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Buscando...
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Dame un plan
          </>
        )}
      </button>

      {/* Result */}
      {noResults && (
        <div className="text-center py-8">
          <p className="text-sage-dim">No hay planes con esas etiquetas. Prueba con otras o sin filtros.</p>
        </div>
      )}

      {idea && (
        <article className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 ${animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          {idea.imagenUrl && (
            <img
              src={idea.imagenUrl}
              alt={`Imagen de ${idea.titulo}`}
              className="w-full h-64 object-cover"
            />
          )}

          <div className="p-6">
            <h2 className="font-bold text-2xl text-sage mb-3">{idea.titulo}</h2>

            {idea.descripcion && (
              <p className="text-light/80 mb-4 leading-relaxed">{idea.descripcion}</p>
            )}

            <address className="flex items-center text-sage-dim mb-3 not-italic">
              <svg className="w-4 h-4 mr-1.5 shrink-0 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {idea.ubicacion}
            </address>

            {idea.fecha && (
              <time dateTime={idea.fecha} className="text-sm text-sage block mb-4">
                {new Date(idea.fecha).toLocaleDateString('es-CL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </time>
            )}

            <ul className="flex flex-wrap gap-1.5 mb-5 list-none" aria-label="Etiquetas del plan">
              {idea.tags.map(tag => (
                <li key={tag}>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border inline-block ${getTagColor(tag)}`}>
                    {tag}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex gap-3">
              <Link
                href={`/idea/${idea.id}`}
                className="flex-1 bg-surface text-sage py-2.5 rounded-lg text-sm font-medium hover:bg-card-hover transition text-center border border-border"
              >
                Ver detalle
              </Link>
              <button
                onClick={handleShare}
                className="flex-1 bg-accent text-light py-2.5 rounded-lg text-sm font-medium hover:bg-accent-light transition cursor-pointer flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Enviar
              </button>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
