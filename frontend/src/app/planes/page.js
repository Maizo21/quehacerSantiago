'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSearch } from '@/context/SearchContext';
import { useAuthorized } from '@/context/AuthContext';
import { useAuth } from '@clerk/nextjs';
import IdeaCard from '@/components/IdeaCard';
import TagFilter from '@/components/TagFilter';
import AddIdeaModal from '@/components/AddIdeaModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function PlanesContent() {
  const { searchQuery } = useSearch();
  const { isAuthorized, isAdmin } = useAuthorized();
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const [ideas, setIdeas] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlTag = searchParams.get('tag');
    if (urlTag) {
      setSelectedTags([urlTag]);
    }
  }, [searchParams]);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      selectedTags.forEach(t => params.append('tag', t));

      const res = await fetch(`${API_URL}/ideas?${params}`);
      const data = await res.json();
      setIdeas(data.ideas || []);
    } catch (err) {
      console.error('Error fetching ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch(`${API_URL}/tags`);
      const data = await res.json();
      setTags(data || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  useEffect(() => { fetchTags(); }, []);
  useEffect(() => { fetchIdeas(); }, [selectedTags, searchQuery]);

  const handleTagToggle = (tagName) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  return (
    <>
      <TagFilter
        tags={tags}
        selectedTags={selectedTags}
        onToggle={handleTagToggle}
        onClear={clearFilters}
      />

      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="font-logo text-3xl tracking-wide text-sage">
            {searchQuery
              ? `RESULTADOS: "${searchQuery.toUpperCase()}"`
              : selectedTags.length > 0
                ? `PLANES: ${selectedTags.join(', ').toUpperCase()}`
                : 'TODOS LOS PLANES'}
          </h2>
          {(selectedTags.length > 0 || searchQuery) && (
            <button
              onClick={clearFilters}
              className="text-sm text-sage-dim hover:text-sage hover:underline mt-1 cursor-pointer transition"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        {isAuthorized && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-accent text-light px-5 py-2.5 rounded-lg hover:bg-accent-light transition font-medium cursor-pointer"
          >
            + Agregar Plan
          </button>
        )}
      </div>

      {loading ? (
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
      ) : ideas.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4" aria-hidden="true">🔍</p>
          <p className="text-sage text-lg">No se encontraron planes</p>
          <p className="text-sage-dim text-sm mt-1">Prueba con otros filtros o agrega uno nuevo</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {ideas.map(idea => (
            <IdeaCard key={idea.id} idea={idea} apiUrl={API_URL} isAdmin={isAdmin} getToken={getToken} onDeleted={fetchIdeas} />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddIdeaModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            fetchIdeas();
            fetchTags();
          }}
          apiUrl={API_URL}
          getToken={getToken}
        />
      )}
    </>
  );
}

export default function PlanesPage() {
  return (
    <Suspense fallback={
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
    }>
      <PlanesContent />
    </Suspense>
  );
}
