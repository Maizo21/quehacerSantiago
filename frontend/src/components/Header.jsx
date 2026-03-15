'use client';

import { useSearch } from '@/context/SearchContext';
import { useState } from 'react';
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';

export default function Header() {
  const { searchQuery, setSearchQuery } = useSearch();
  const [inputValue, setInputValue] = useState(searchQuery);
  const { isSignedIn } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(inputValue);
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
    if (e.target.value === '') {
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-accent sticky top-0 z-40" role="banner">
      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4" aria-label="Navegación principal">
        <a href="/" className="font-logo text-2xl tracking-wide text-light whitespace-nowrap hidden sm:block" aria-label="Qué Hacer en Santiago — Inicio">
          QUÉ HACER EN SANTIAGO
        </a>
        <a href="/" className="font-logo text-2xl tracking-wide text-light sm:hidden" aria-label="Qué Hacer en Santiago — Inicio">
          QHS
        </a>

        <form onSubmit={handleSubmit} className="flex-1 max-w-md" role="search" aria-label="Buscar planes">
          <div className="relative">
            <label htmlFor="search-input" className="sr-only">Buscar planes</label>
            <input
              id="search-input"
              type="search"
              value={inputValue}
              onChange={handleChange}
              placeholder="Buscar planes..."
              className="w-full bg-light/10 border border-light/20 rounded-full px-4 py-2 pl-10 text-light placeholder-light/50 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-light/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </form>

        {isSignedIn ? (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        ) : (
          <SignInButton mode="modal">
            <button className="flex items-center gap-2 text-light/70 hover:text-light transition cursor-pointer" aria-label="Iniciar sesión">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="hidden md:inline text-sm font-medium">Iniciar sesión</span>
            </button>
          </SignInButton>
        )}
      </nav>
    </header>
  );
}
