'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthorized } from '@/context/AuthContext';
import { useAuth } from '@clerk/nextjs';
import EditIdeaModal from '@/components/EditIdeaModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

export default function IdeaDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthorized, isAdmin } = useAuthorized();
  const { getToken } = useAuth();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchIdea = async () => {
    try {
      const res = await fetch(`${API_URL}/ideas?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setIdea(data);
      }
    } catch (err) {
      console.error('Error fetching idea:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdea();
  }, [id]);

  const handleShare = async () => {
    const url = `${window.location.origin}/idea/${id}`;
    const message = `Hola, me gustaría hacer este plan: ${idea?.titulo} 📍 ${idea?.ubicacion}\n${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(message);
      alert('Mensaje copiado al portapapeles');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este plan?')) return;
    setDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/ideas?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        router.push('/');
      } else {
        alert('Error al eliminar el plan');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-6 bg-card rounded w-24 mb-6" />
        <div className="h-72 bg-card rounded-2xl mb-6" />
        <div className="h-10 bg-card rounded w-3/4 mb-4" />
        <div className="h-4 bg-card rounded w-1/2 mb-6" />
        <div className="flex gap-2">
          <div className="h-7 bg-card rounded-full w-20" />
          <div className="h-7 bg-card rounded-full w-24" />
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-sage text-lg">Plan no encontrado</p>
        <Link href="/" className="text-sage-dim hover:text-sage hover:underline mt-4 inline-block transition">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const imageUrl = idea.imagenUrl || null;

  return (
    <article className="max-w-3xl mx-auto">
      <nav aria-label="Volver al inicio" className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sage-dim hover:text-sage transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>
      </nav>

      {imageUrl && (
        <img
          src={imageUrl}
          alt={`Imagen de ${idea.titulo}`}
          className="w-full h-72 object-cover rounded-2xl border border-border mb-6"
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <h1 className="font-bold text-3xl text-sage">
          {idea.titulo.toUpperCase()}
        </h1>
        {(isAuthorized || isAdmin) && (
          <div className="flex gap-2 shrink-0">
            {isAuthorized && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-sage/30 text-sage hover:bg-sage/10 transition cursor-pointer"
              >
                Editar
              </button>
            )}
            {isAdmin && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-red-800/50 text-red-400 hover:bg-red-900/30 transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sage-dim mb-6">
        <address className="flex items-center gap-1.5 not-italic">
          <svg className="w-5 h-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{idea.ubicacion}</span>
        </address>

        {idea.fecha && (
          <div className="flex items-center gap-1.5">
            <svg className="w-5 h-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time dateTime={idea.fecha}>
              {new Date(idea.fecha).toLocaleDateString('es-CL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
        )}
      </div>

      {idea.descripcion && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <p className="text-light leading-relaxed">{idea.descripcion}</p>
        </div>
      )}

      {idea.destacado && (
        <div className="bg-sage/10 border border-sage/20 rounded-lg px-4 py-2 mb-6 inline-block">
          <span className="text-sage text-sm font-medium">Plan destacado</span>
        </div>
      )}

      <ul className="flex flex-wrap gap-2 mb-6 list-none" aria-label="Etiquetas del plan">
        {idea.tags.map(tag => (
          <li key={tag}>
            <Link
              href={`/?tag=${encodeURIComponent(tag)}`}
              className={`text-sm px-3.5 py-1.5 rounded-full font-medium border hover:brightness-125 transition inline-block ${getTagColor(tag)}`}
            >
              {tag}
            </Link>
          </li>
        ))}
      </ul>

      <button
        onClick={handleShare}
        className="inline-flex items-center gap-2 bg-accent text-light px-5 py-2.5 rounded-lg font-medium hover:bg-accent-light transition cursor-pointer"
        aria-label={`Compartir plan ${idea.titulo}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Enviar
      </button>

      {idea.creadoPor && (
        <footer className="text-sage-dim text-sm mt-8 border-t border-border pt-4">
          Propuesto por: {idea.creadoPor}
        </footer>
      )}

      {showEditModal && (
        <EditIdeaModal
          idea={idea}
          onClose={() => setShowEditModal(false)}
          onUpdated={fetchIdea}
          apiUrl={API_URL}
          getToken={getToken}
        />
      )}
    </article>
  );
}
