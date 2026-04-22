'use client';

import { useState } from 'react';
import Link from 'next/link';

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

const GRADIENTS = [
  'from-emerald-800 to-teal-900',
  'from-green-800 to-emerald-900',
  'from-teal-800 to-cyan-900',
  'from-emerald-900 to-green-800',
  'from-cyan-800 to-teal-900',
  'from-green-900 to-emerald-800',
];

function getGradient(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export default function IdeaCard({ idea, apiUrl, isAdmin, getToken, onDeleted }) {
  const [showAllTags, setShowAllTags] = useState(false);

  const imageUrl = idea.imagenUrl || null;

  const visibleTags = showAllTags ? idea.tags : idea.tags.slice(0, 3);
  const hiddenCount = idea.tags.length - 3;

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Eliminar este plan?')) return;
    try {
      const token = await getToken();
      const res = await fetch(`${apiUrl}/ideas?id=${idea.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok && onDeleted) onDeleted();
    } catch {
      alert('Error al eliminar');
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
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
    <article className="group relative bg-card rounded-2xl border border-border overflow-hidden hover:border-sage/30 hover:shadow-[0_8px_30px_rgba(171,200,162,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <Link href={`/idea/${idea.id}`} className="block relative h-52 overflow-hidden" aria-label={`Ver detalle de ${idea.titulo}`}>
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

        {idea.destacado && (
          <span className={`absolute top-3 ${isAdmin ? 'right-12' : 'right-3'} bg-sage text-dark text-xs font-bold px-2.5 py-1 rounded-full`}>
            Destacado
          </span>
        )}

        {isAdmin && (
          <button
            onClick={handleDelete}
            className="absolute top-3 right-3 bg-black/50 hover:bg-red-900/80 text-light/70 hover:text-red-300 w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer z-10"
            aria-label={`Eliminar plan ${idea.titulo}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-light text-lg leading-snug line-clamp-2 drop-shadow-lg">
            {idea.titulo}
          </h3>
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        {idea.descripcion && (
          <p className="text-sm text-sage-dim mb-3 line-clamp-2">{idea.descripcion}</p>
        )}

        <address className="flex items-center text-sm text-sage-dim mb-3 not-italic">
          <svg className="w-4 h-4 mr-1.5 shrink-0 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{idea.ubicacion}</span>
        </address>

        {idea.fecha && (
          <time dateTime={idea.fecha} className="text-sm text-sage mb-3 block">
            {new Date(idea.fecha).toLocaleDateString('es-CL', {
              weekday: 'long',
              day: 'numeric',
              month: 'short'
            })}
          </time>
        )}

        <button
          onClick={handleShare}
          className="w-full bg-accent text-white py-2 rounded-lg text-sm font-medium hover:bg-accent-light transition cursor-pointer flex items-center justify-center gap-2 mb-3"
          aria-label={`Compartir plan ${idea.titulo}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Enviar
        </button>

        <ul className="flex flex-wrap gap-1.5 border-t border-border/50 pt-3 mt-auto list-none" aria-label="Etiquetas del plan">
          {visibleTags.map(tag => (
            <li key={tag}>
              <Link
                href={`/?tag=${encodeURIComponent(tag)}`}
                className={`text-xs px-2.5 py-1 rounded-full font-medium border hover:brightness-125 transition inline-block ${getTagColor(tag)}`}
              >
                {tag}
              </Link>
            </li>
          ))}
          {!showAllTags && hiddenCount > 0 && (
            <li>
              <button
                onClick={(e) => { e.preventDefault(); setShowAllTags(true); }}
                className="text-xs px-2.5 py-1 rounded-full bg-surface text-sage border border-border hover:bg-card-hover hover:text-light transition cursor-pointer"
                aria-label={`Mostrar ${hiddenCount} etiquetas más`}
              >
                +{hiddenCount}
              </button>
            </li>
          )}
          {showAllTags && hiddenCount > 0 && (
            <li>
              <button
                onClick={(e) => { e.preventDefault(); setShowAllTags(false); }}
                className="text-xs px-2.5 py-1 rounded-full bg-surface text-sage-dim border border-border hover:text-light transition cursor-pointer"
                aria-label="Mostrar menos etiquetas"
              >
                menos
              </button>
            </li>
          )}
        </ul>
      </div>
    </article>
  );
}
