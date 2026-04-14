'use client';

import Link from 'next/link';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export default function DayDetail({ day, month, year, plans, onRemove }) {
  if (!day || plans.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <h3 className="font-bold text-sage mb-4">
        {day} de {MONTHS[month - 1]} de {year} — {plans.length} plan{plans.length > 1 ? 'es' : ''}
      </h3>

      <div className="space-y-4">
        {plans.map(plan => (
          <div key={plan.id} className="flex gap-4 bg-surface border border-border/50 rounded-xl p-4">
            {plan.foto && (
              <img
                src={plan.foto}
                alt={`Foto de ${plan.titulo}`}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shrink-0 border border-border"
              />
            )}

            <div className="flex-1 min-w-0">
              {plan.idea ? (
                <Link
                  href={`/idea/${plan.ideaId}`}
                  className="font-semibold text-light hover:text-sage transition line-clamp-1"
                >
                  {plan.titulo}
                </Link>
              ) : (
                <span className="font-semibold text-light line-clamp-1" title="Este plan ya no está disponible">
                  {plan.titulo}
                </span>
              )}

              <p className="text-sm text-sage-dim mt-1 flex items-center gap-1">
                <svg className="w-4 h-4 shrink-0 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{plan.ubicacion}</span>
              </p>

              {plan.nota && (
                <p className="text-sm text-light/70 mt-2 italic line-clamp-2">"{plan.nota}"</p>
              )}

              <button
                onClick={() => onRemove(plan.id)}
                className="text-xs text-sage-dim/60 hover:text-red-400 mt-2 transition cursor-pointer"
                aria-label={`Desmarcar ${plan.titulo}`}
              >
                Desmarcar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
