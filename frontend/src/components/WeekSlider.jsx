'use client';

import { useRef } from 'react';
import Link from 'next/link';

const GRADIENTS = [
  'from-emerald-800 to-teal-900',
  'from-green-800 to-emerald-900',
  'from-teal-800 to-cyan-900',
  'from-emerald-900 to-green-800',
];

function getGradient(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export default function WeekSlider({ ideas, apiUrl }) {
  const scrollRef = useRef(null);

  if (!ideas || ideas.length === 0) return null;

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = 304;
    scrollRef.current.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  return (
    <section className="mb-10" aria-label="Planes de esta semana">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-logo text-3xl tracking-wide text-sage">
          ESTA SEMANA
        </h2>
        <div className="flex gap-2" role="group" aria-label="Controles del carrusel">
          <button
            onClick={() => scroll(-1)}
            className="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center text-sage hover:bg-card hover:border-sage/30 transition cursor-pointer"
            aria-label="Desplazar planes hacia la izquierda"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center text-sage hover:bg-card hover:border-sage/30 transition cursor-pointer"
            aria-label="Desplazar planes hacia la derecha"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
        role="list"
        aria-label="Lista de planes próximos"
      >
        {ideas.map(idea => {
          const imageUrl = idea.imagenUrl
            ? `${apiUrl}/uploads/${idea.imagenUrl}`
            : null;

          return (
            <Link
              key={idea.id}
              href={`/idea/${idea.id}`}
              className="group snap-start shrink-0 w-72 rounded-2xl border border-border overflow-hidden hover:border-sage/30 hover:shadow-[0_8px_30px_rgba(171,200,162,0.08)] hover:-translate-y-1 transition-all duration-300 relative h-48"
              role="listitem"
              aria-label={`${idea.titulo} — ${idea.ubicacion}`}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`Imagen de ${idea.titulo}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${getGradient(idea.id)}`} role="img" aria-label={`Fondo decorativo para ${idea.titulo}`} />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" aria-hidden="true" />

              {idea.fecha && (
                <time dateTime={idea.fecha} className="absolute top-3 left-3 bg-dark/70 text-sage text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm border border-sage/20">
                  {new Date(idea.fecha).toLocaleDateString('es-CL', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </time>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-bold text-light text-sm leading-tight line-clamp-2 mb-1 drop-shadow-lg">
                  {idea.titulo}
                </h3>
                <p className="text-xs text-light/70 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{idea.ubicacion}</span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
