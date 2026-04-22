'use client';

import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';

export default function FilterChips({ activeCategory }) {
  const allActive = !activeCategory;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
      <Link
        href="/"
        className={`text-sm px-4 py-2 rounded-full border font-medium transition cursor-pointer ${
          allActive
            ? 'bg-sage/25 text-sage border-sage/50'
            : 'bg-card text-sage-dim border-border hover:border-sage/30 hover:text-sage'
        }`}
        aria-pressed={allActive}
      >
        Todo
      </Link>
      {CATEGORIES.map(cat => {
        const isActive = activeCategory === cat.key;
        return (
          <Link
            key={cat.key}
            href={isActive ? '/' : `/?category=${cat.key}`}
            className={`text-sm px-4 py-2 rounded-full border font-medium transition cursor-pointer inline-flex items-center gap-1.5 ${
              isActive ? cat.activeStyle : cat.style + ' hover:brightness-125'
            }`}
            aria-pressed={isActive}
          >
            <span aria-hidden="true">{cat.emoji}</span>
            {cat.label}
          </Link>
        );
      })}
    </div>
  );
}
