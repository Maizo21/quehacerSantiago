'use client';

import Link from 'next/link';
import FilterChips from './FilterChips';

const DAY_LABELS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTH_LABELS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function getContextualQuestion() {
  const today = new Date();
  const day = today.getDay();
  if (day === 5) return '¿QUÉ HACES ESTE FIN DE SEMANA?';
  if (day === 6 || day === 0) return '¿QUÉ HACES HOY?';
  return '¿TIENES PLAN PARA HOY?';
}

function getTodayLabel() {
  const today = new Date();
  return `${DAY_LABELS[today.getDay()]} · ${today.getDate()} de ${MONTH_LABELS[today.getMonth()]}`;
}

export default function HomeHero({ activeCategory }) {
  return (
    <section
      className="relative bg-gradient-to-br from-surface via-card to-surface border border-border rounded-2xl p-6 sm:p-8 md:p-10 mb-8 overflow-hidden"
      aria-labelledby="home-hero-title"
    >
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-sage/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative">
        <p className="text-xs sm:text-sm text-sage-dim uppercase tracking-widest mb-2">
          {getTodayLabel()}
        </p>

        <h1
          id="home-hero-title"
          className="font-logo text-2xl sm:text-4xl md:text-5xl tracking-wide text-sage mb-6 leading-tight"
        >
          {getContextualQuestion()}
        </h1>

        <div className="mb-6">
          <FilterChips activeCategory={activeCategory} />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Link
            href="/random"
            className="flex items-center justify-center gap-1.5 sm:gap-2 bg-accent text-white px-3 py-2 text-sm sm:px-5 sm:py-2.5 sm:text-base rounded-lg font-medium hover:bg-accent-light transition cursor-pointer whitespace-nowrap"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sorpréndeme
          </Link>
          <Link
            href="/planes"
            className="flex items-center justify-center gap-2 text-sage border border-sage/30 px-3 py-2 text-sm sm:px-5 sm:py-2.5 sm:text-base rounded-lg font-medium hover:bg-sage/10 transition cursor-pointer whitespace-nowrap"
          >
            Ver todos los planes
          </Link>
        </div>
      </div>
    </section>
  );
}
