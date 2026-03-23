'use client';

import { useSearch } from '@/context/SearchContext';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Header() {
  const { searchQuery, setSearchQuery } = useSearch();
  const { theme, toggleTheme } = useTheme();
  const [inputValue, setInputValue] = useState(searchQuery);
  const { isSignedIn } = useAuth();
  const [tags, setTags] = useState([]);
  const [showCategories, setShowCategories] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch(`${API_URL}/tags`);
        const data = await res.json();
        setTags(data || []);
      } catch {}
    };
    fetchTags();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCategories(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setShowMobileMenu(false);
        setShowMobileCategories(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="bg-accent sticky top-0 z-40 theme-fixed" role="banner">
      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3" aria-label="Navegación principal">
        <Link href="/" className="font-logo text-2xl tracking-wide text-light whitespace-nowrap hidden sm:block" aria-label="Qué Hacer en Santiago — Inicio">
          QUE HACER EN SANTIAGO
        </Link>
        <Link href="/" className="font-logo text-2xl tracking-wide text-light sm:hidden" aria-label="Qué Hacer en Santiago — Inicio">
          QHS
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link href="/" className="text-light/80 hover:text-light text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-light/10 transition">
            Inicio
          </Link>
          <Link href="/planes" className="text-light/80 hover:text-light text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-light/10 transition">
            Todos los planes
          </Link>
          <Link href="/random" className="text-light/80 hover:text-light text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-light/10 transition">
            Random
          </Link>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="text-light/80 hover:text-light text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-light/10 transition flex items-center gap-1 cursor-pointer"
              aria-expanded={showCategories}
              aria-haspopup="true"
            >
              Categorías
              <svg className={`w-4 h-4 transition-transform ${showCategories ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCategories && tags.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-xl py-2 min-w-48 max-h-72 overflow-y-auto z-50">
                {tags.map(tag => (
                  <Link
                    key={tag.id}
                    href={`/planes?tag=${encodeURIComponent(tag.nombre)}`}
                    className="block px-4 py-2 text-sm text-sage-dim hover:text-light hover:bg-surface transition"
                    onClick={() => setShowCategories(false)}
                  >
                    {tag.nombre}
                    <span className="ml-2 text-xs text-sage-dim/60">({tag.count})</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>

        {/* Mobile nav */}
        <div className="relative md:hidden" ref={mobileMenuRef}>
          <button
            onClick={() => { setShowMobileMenu(!showMobileMenu); setShowMobileCategories(false); }}
            className="text-light/70 hover:text-light transition cursor-pointer"
            aria-label="Abrir menú de navegación"
            aria-expanded={showMobileMenu}
            aria-haspopup="true"
          >
            {showMobileMenu ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            )}
          </button>
          {showMobileMenu && (
            <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-xl py-2 min-w-52 z-50">
              <Link
                href="/"
                className="block px-4 py-2.5 text-sm text-sage-dim hover:text-light hover:bg-surface transition"
                onClick={() => setShowMobileMenu(false)}
              >
                Inicio
              </Link>
              <Link
                href="/planes"
                className="block px-4 py-2.5 text-sm text-sage-dim hover:text-light hover:bg-surface transition"
                onClick={() => setShowMobileMenu(false)}
              >
                Todos los planes
              </Link>
              <Link
                href="/random"
                className="block px-4 py-2.5 text-sm text-sage-dim hover:text-light hover:bg-surface transition"
                onClick={() => setShowMobileMenu(false)}
              >
                Random
              </Link>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => setShowMobileCategories(!showMobileCategories)}
                className="w-full text-left px-4 py-2.5 text-sm text-sage-dim hover:text-light hover:bg-surface transition flex items-center justify-between cursor-pointer"
              >
                Categorías
                <svg className={`w-4 h-4 transition-transform ${showMobileCategories ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showMobileCategories && tags.length > 0 && (
                <div className="max-h-48 overflow-y-auto">
                  {tags.map(tag => (
                    <Link
                      key={tag.id}
                      href={`/planes?tag=${encodeURIComponent(tag.nombre)}`}
                      className="block pl-8 pr-4 py-2 text-sm text-sage-dim/80 hover:text-light hover:bg-surface transition"
                      onClick={() => { setShowMobileMenu(false); setShowMobileCategories(false); }}
                    >
                      {tag.nombre}
                      <span className="ml-2 text-xs text-sage-dim/50">({tag.count})</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="text-light/70 hover:text-light transition cursor-pointer"
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {isSignedIn ? (
          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
        ) : (
          <SignInButton mode="modal">
            <button className="flex items-center gap-2 text-light/70 hover:text-light transition cursor-pointer" aria-label="Iniciar sesión">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden md:inline text-sm font-medium">Iniciar sesión</span>
            </button>
          </SignInButton>
        )}
      </nav>
    </header>
  );
}
