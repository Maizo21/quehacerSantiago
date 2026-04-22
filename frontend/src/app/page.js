'use client';

import { useState, useEffect } from 'react';
import { useSearch } from '@/context/SearchContext';
import { useAuthorized } from '@/context/AuthContext';
import { useAuth } from '@clerk/nextjs';
import IdeaCard from '@/components/IdeaCard';
import SectionSlider from '@/components/SectionSlider';
import AddIdeaModal from '@/components/AddIdeaModal';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const { searchQuery } = useSearch();
  const { isAuthorized, isAdmin } = useAuthorized();
  const { getToken } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`${API_URL}/ideas?${params}`);
      const data = await res.json();
      setIdeas(data.ideas || []);
    } catch (err) {
      console.error('Error fetching ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [searchQuery]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Próximos eventos (fecha >= hoy, sin importar cuán lejos)
  const upcomingPlans = ideas.filter(i => i.fecha && new Date(i.fecha) >= now)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  // Planes por categoría (sin importar fecha)
  const outdoorPlans = ideas.filter(i =>
    i.tags.some(t => t.toLowerCase().includes('outdoor') || t.toLowerCase().includes('aire libre'))
  );
  const culturalPlans = ideas.filter(i =>
    i.tags.some(t => t.toLowerCase().includes('cultural') || t.toLowerCase().includes('cultura') || t.toLowerCase().includes('museo') || t.toLowerCase().includes('arte'))
  );
  const freePlans = ideas.filter(i =>
    i.tags.some(t => t.toLowerCase().includes('gratuito') || t.toLowerCase().includes('gratis') || t.toLowerCase().includes('free'))
  );

  // Sugerencia: max 20 planes
  const suggestionPlans = ideas.slice(0, 20);

  // Planes que ya pasaron
  const pastPlans = ideas.filter(i => i.fecha && new Date(i.fecha) < now)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  // Si hay búsqueda activa, mostrar resultados en grid
  if (searchQuery) {
    return (
      <>
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h2 className="font-logo text-3xl tracking-wide text-sage">
            RESULTADOS: &ldquo;{searchQuery.toUpperCase()}&rdquo;
          </h2>
        </div>
        {loading ? (
          <LoadingSkeleton />
        ) : ideas.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {ideas.map(idea => (
              <IdeaCard key={idea.id} idea={idea} apiUrl={API_URL} isAdmin={isAdmin} getToken={getToken} onDeleted={fetchIdeas} />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {loading ? (
        <LoadingSkeleton />
      ) : ideas.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <SectionSlider title="PRÓXIMOS EVENTOS" ideas={upcomingPlans} />
          <SectionSlider title="OUTDOOR" ideas={outdoorPlans} />
          <SectionSlider title="CULTURAL" ideas={culturalPlans} />
          <SectionSlider title="GRATIS" ideas={freePlans} />

          {/* Sugerencias — grid limitado a 20 */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-logo text-3xl tracking-wide text-sage">SUGERENCIAS</h2>
              <Link href="/planes" className="text-sm text-sage-dim hover:text-sage hover:underline transition">
                Ver todos →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {suggestionPlans.map(idea => (
                <IdeaCard key={idea.id} idea={idea} apiUrl={API_URL} isAdmin={isAdmin} getToken={getToken} onDeleted={fetchIdeas} />
              ))}
            </div>
          </section>

          <SectionSlider title="YA PASARON" ideas={pastPlans} isPast />
        </>
      )}

      {isAuthorized && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-6 right-6 bg-accent text-white w-14 h-14 rounded-full shadow-lg hover:bg-accent-light transition flex items-center justify-center text-2xl cursor-pointer z-30"
          aria-label="Agregar nuevo plan"
        >
          +
        </button>
      )}

      {showAddModal && (
        <AddIdeaModal
          onClose={() => setShowAddModal(false)}
          onCreated={fetchIdeas}
          apiUrl={API_URL}
          getToken={getToken}
        />
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
          <div className="h-48 bg-surface" />
          <div className="p-5 space-y-3">
            <div className="h-5 bg-surface rounded w-3/4" />
            <div className="h-3 bg-surface rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="text-5xl mb-4" aria-hidden="true">🔍</p>
      <p className="text-sage text-lg">No se encontraron planes</p>
      <p className="text-sage-dim text-sm mt-1">Prueba con otros filtros o agrega uno nuevo</p>
    </div>
  );
}
