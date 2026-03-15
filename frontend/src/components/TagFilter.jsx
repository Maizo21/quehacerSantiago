'use client';

import { useState, useRef, useEffect } from 'react';

export default function TagFilter({ tags, selectedTags, onToggle, onClear }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!tags.length) return null;

  return (
    <div className="mb-6 relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-sage hover:border-sage/30 transition cursor-pointer"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Filtrar por etiquetas${selectedTags.length > 0 ? `, ${selectedTags.length} seleccionadas` : ''}`}
      >
        <svg className="w-4 h-4 text-sage-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filtrar por etiquetas
        {selectedTags.length > 0 && (
          <span className="bg-sage text-dark text-xs font-bold px-1.5 py-0.5 rounded-full" aria-hidden="true">
            {selectedTags.length}
          </span>
        )}
        <svg className={`w-4 h-4 text-sage-dim transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <fieldset className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-xl shadow-black/40 z-30 w-72 max-h-80 overflow-y-auto" role="listbox" aria-label="Etiquetas disponibles">
          <legend className="sr-only">Seleccionar etiquetas para filtrar</legend>
          {selectedTags.length > 0 && (
            <button
              onClick={onClear}
              className="w-full text-left px-4 py-2 text-xs text-sage hover:bg-card transition border-b border-border cursor-pointer"
            >
              Limpiar filtros ({selectedTags.length})
            </button>
          )}
          {tags.map(tag => (
            <label
              key={tag.id}
              className="flex items-center gap-3 px-4 py-2 hover:bg-card transition cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.nombre)}
                onChange={() => onToggle(tag.nombre)}
                className="w-4 h-4 rounded accent-sage cursor-pointer"
                aria-label={`Filtrar por ${tag.nombre}`}
              />
              <span className="text-sm text-light flex-1">{tag.nombre}</span>
              <span className="text-xs text-sage-dim" aria-label={`${tag.count} planes`}>{tag.count}</span>
            </label>
          ))}
        </fieldset>
      )}

      {selectedTags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mt-2 list-none" aria-label="Etiquetas seleccionadas">
          {selectedTags.map(tag => (
            <li key={tag}>
              <button
                onClick={() => onToggle(tag)}
                className="flex items-center gap-1 bg-sage/15 text-sage text-xs px-2.5 py-1 rounded-full border border-sage/20 hover:bg-sage/25 transition cursor-pointer"
                aria-label={`Quitar filtro ${tag}`}
              >
                {tag}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
