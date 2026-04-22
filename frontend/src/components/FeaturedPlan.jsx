'use client';

import Link from 'next/link';

export default function FeaturedPlan({ idea }) {
  if (!idea) return null;

  const imageUrl = idea.imagenUrl || null;

  return (
    <section className="mb-10" aria-label="Plan destacado editorial">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs text-sage-dim uppercase tracking-widest">Destacado de la semana</h2>
        <span className="text-xs text-sage-dim/70">editor&apos;s pick</span>
      </div>

      <Link
        href={`/idea/${idea.id}`}
        className="group block relative rounded-2xl overflow-hidden border border-border hover:border-sage/40 transition-all duration-300"
        aria-label={`Ver detalle del plan destacado: ${idea.titulo}`}
      >
        <div className="relative h-64 sm:h-80">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Imagen de ${idea.titulo}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent to-accent-light" aria-hidden="true" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" aria-hidden="true" />

          <div className="absolute top-4 left-4">
            <span className="bg-sage text-dark text-xs font-bold px-3 py-1 rounded-full">
              Destacado
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
            <h3 className="font-bold text-white text-xl sm:text-2xl md:text-3xl leading-tight mb-2 drop-shadow-lg">
              {idea.titulo}
            </h3>
            <p className="text-sm sm:text-base text-white/80 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-sage shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{idea.ubicacion}</span>
            </p>
          </div>
        </div>
      </Link>
    </section>
  );
}
