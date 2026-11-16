'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useAuthorized } from '@/context/AuthContext';
import EditIdeaModal from '@/components/EditIdeaModal';
import { dateKey, formatEventRange, todayInSantiago } from '@/lib/eventDates';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DISMISSED_SUGGESTIONS_KEY = 'quehacerSantiago:dismissed-suggestions:v1';
const DISCOVERY_RESULTS_KEY = 'quehacerSantiago:discovery-results:v3';
const DISCOVERY_CACHE_MS = 6 * 60 * 60 * 1000;
const MAX_DISMISSED_SUGGESTIONS = 500;
const DISCOVERY_EXTENSION_CHANNEL = 'quehacer-santiago-local-discovery-v1';
const RECOMMENDED_SOURCES = [
  'biblioteca-santiago',
  'biblioteca-nacional',
  'bibliotecas-providencia',
  'patrimonio-cultural',
  'gam',
  'camara-libro',
  'hoy-jugue',
  'mesa-1'
];

function addDays(key, days) {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function endOfWeek(key) {
  const date = new Date(`${key}T00:00:00.000Z`);
  const day = date.getUTCDay();
  return addDays(key, day === 0 ? 0 : 7 - day);
}

function priceLabel(item) {
  if (item.precioEstado === 'GRATIS') return 'Gratis';
  if (item.precioEstado === 'PAGADO') return `$${Number(item.precio || 0).toLocaleString('es-CL')}`;
  return 'Precio no informado';
}

function suggestionKey(item) {
  return item.fingerprint || item.id;
}

function readDismissedSuggestions() {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = JSON.parse(window.localStorage.getItem(DISMISSED_SUGGESTIONS_KEY) || '[]');
    return new Set(Array.isArray(stored) ? stored.filter(value => typeof value === 'string') : []);
  } catch {
    return new Set();
  }
}

function writeDismissedSuggestions(values) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      DISMISSED_SUGGESTIONS_KEY,
      JSON.stringify(Array.from(values).slice(-MAX_DISMISSED_SUGGESTIONS))
    );
  } catch {}
}

function readLocalDiscovery() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = JSON.parse(window.localStorage.getItem(DISCOVERY_RESULTS_KEY) || 'null');
    if (!stored || !Array.isArray(stored.suggestions) || !Number.isFinite(stored.savedAt)) return null;
    if (Date.now() - stored.savedAt > DISCOVERY_CACHE_MS) {
      window.localStorage.removeItem(DISCOVERY_RESULTS_KEY);
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

function writeLocalDiscovery(suggestions, resultados = [], savedAt = Date.now(), sourceIds = []) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DISCOVERY_RESULTS_KEY, JSON.stringify({
      savedAt,
      suggestions: suggestions.slice(0, 300),
      resultados,
      sourceIds
    }));
  } catch {}
}

function visibleLocalSuggestions() {
  const stored = readLocalDiscovery();
  const dismissed = readDismissedSuggestions();
  return {
    stored,
    dismissed,
    suggestions: (stored?.suggestions || []).filter(item => !dismissed.has(suggestionKey(item)))
  };
}

function extensionRequest(type, payload = {}, { timeout = 3000, onProgress } = {}) {
  if (typeof window === 'undefined') return Promise.reject(new Error('El navegador no está disponible'));
  return new Promise((resolve, reject) => {
    const requestId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener('message', handleMessage);
    };
    const handleMessage = event => {
      const response = event.data;
      if (event.source !== window || event.origin !== window.location.origin) return;
      if (response?.channel !== DISCOVERY_EXTENSION_CHANNEL || response.direction !== 'extension-to-page' || response.requestId !== requestId) return;
      if (response.progress) {
        onProgress?.(response);
        return;
      }
      cleanup();
      if (!response.ok) reject(new Error(response.error || 'El recolector local no pudo completar la operación'));
      else resolve(response);
    };
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('No se detectó la extensión del recolector local. Instálala o recárgala y luego actualiza esta página.'));
    }, timeout);
    window.addEventListener('message', handleMessage);
    window.postMessage({
      channel: DISCOVERY_EXTENSION_CHANNEL,
      direction: 'page-to-extension',
      requestId,
      type,
      ...payload
    }, window.location.origin);
  });
}

export default function AdminPage() {
  const { getToken } = useAuth();
  const { isAdmin, loading: authLoading } = useAuthorized();
  const [section, setSection] = useState('suggestions');
  const [sources, setSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState(RECOMMENDED_SOURCES);
  const [suggestions, setSuggestions] = useState([]);
  const [dismissedCount, setDismissedCount] = useState(0);
  const [ideas, setIdeas] = useState([]);
  const [planStatus, setPlanStatus] = useState('expired');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [extensionStatus, setExtensionStatus] = useState('checking');
  const [extensionVersion, setExtensionVersion] = useState('');

  const authorizedFetch = useCallback(async (path, options = {}) => {
    const token = await getToken();
    return fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` }
    });
  }, [getToken]);

  const loadSuggestions = useCallback(() => {
    const { suggestions: localSuggestions, dismissed } = visibleLocalSuggestions();
    setDismissedCount(dismissed.size);
    setSuggestions(localSuggestions);
  }, []);

  const loadSources = useCallback(async () => {
    setExtensionStatus('checking');
    const ping = await extensionRequest('PING');
    const response = await extensionRequest('LIST_SOURCES');
    const data = response.sources || [];
    const statusById = new Map((readLocalDiscovery()?.resultados || []).map(item => [item.sourceId, item]));
    setSources((data || []).map(source => {
      const status = statusById.get(source.id);
      return { ...source, ultimoEstado: status?.estado || null, ultimoError: status?.error || null };
    }));
    setExtensionVersion(ping.version || '');
    setExtensionStatus('ready');
  }, []);

  const loadIdeas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authorizedFetch(`/admin/ideas?status=${planStatus}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.Error || 'No se pudieron cargar los planes');
      setIdeas(data.ideas || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, planStatus]);

  useEffect(() => {
    if (!isAdmin) return;
    loadSuggestions();
    loadSources().catch(err => {
      setExtensionStatus('missing');
      setError(err.message);
    });
  }, [isAdmin, loadSources, loadSuggestions]);

  useEffect(() => {
    if (isAdmin && section === 'plans') loadIdeas();
  }, [isAdmin, section, loadIdeas]);

  const buckets = useMemo(() => {
    const today = todayInSantiago();
    const thisSunday = endOfWeek(today);
    const nextSunday = addDays(thisSunday, 7);
    return [
      { key: 'this', title: 'ESTA SEMANA', items: suggestions.filter(item => dateKey(item.fecha) <= thisSunday) },
      { key: 'next', title: 'PRÓXIMA SEMANA', items: suggestions.filter(item => dateKey(item.fecha) > thisSunday && dateKey(item.fecha) <= nextSunday) },
      { key: 'month', title: 'PRÓXIMOS 45 DÍAS', items: suggestions.filter(item => dateKey(item.fecha) > nextSunday) }
    ];
  }, [suggestions]);

  const runDiscovery = async () => {
    if (selectedSources.length === 0) return;
    const local = visibleLocalSuggestions();
    const sameSources = local.stored
      && [...(local.stored.sourceIds || [])].sort().join('|') === [...selectedSources].sort().join('|');
    if (sameSources) {
      setSuggestions(local.suggestions);
      setDismissedCount(local.dismissed.size);
      setMessage(`${local.suggestions.length} sugerencias recuperadas del navegador. No se consultó Railway.`);
      return;
    }
    setRunning(true);
    setError('');
    setMessage('El recolector local está consultando las carteleras desde este navegador...');
    try {
      const extensionResponse = await extensionRequest('RUN_DISCOVERY', { sourceIds: selectedSources }, {
        timeout: 8 * 60 * 1000,
        onProgress: progress => setMessage(`Consultando ${progress.sourceName} (${progress.completed + 1} de ${progress.total}) desde tu navegador...`)
      });
      const data = extensionResponse.result || {};
      const failures = (data.resultados || []).filter(item => item.estado === 'ERROR').length;
      const partials = (data.resultados || []).filter(item => item.estado === 'PARCIAL').length;
      const aiUses = Number(data.iaUsos || 0);
      const discovered = data.suggestions || [];
      const dismissed = readDismissedSuggestions();
      writeLocalDiscovery(discovered, data.resultados || [], Date.now(), selectedSources);
      setSuggestions(discovered.filter(item => !dismissed.has(suggestionKey(item))));
      setDismissedCount(dismissed.size);
      const statusById = new Map((data.resultados || []).map(item => [item.sourceId, item]));
      setSources(current => current.map(source => {
        const status = statusById.get(source.id);
        return { ...source, ultimoEstado: status?.estado || null, ultimoError: status?.error || null };
      }));
      const statusSummary = [
        failures ? `${failures} fuentes fallaron` : '',
        partials ? `${partials} respondieron parcialmente` : '',
        `${aiUses} consultas IA`,
        '0 consultas de scraping a Railway'
      ].filter(Boolean).join(' · ');
      setMessage(`${data.nuevos || 0} sugerencias nuevas. ${statusSummary || 'Todas las fuentes respondieron.'}`);
    } catch (err) {
      setError(err.message);
      setMessage('');
    } finally {
      setRunning(false);
    }
  };

  const suggestionAction = async (id, action) => {
    setError('');
    if (action === 'reject') {
      const item = suggestions.find(suggestion => suggestion.id === id);
      if (!item) return;
      const dismissed = readDismissedSuggestions();
      dismissed.add(suggestionKey(item));
      writeDismissedSuggestions(dismissed);
      setDismissedCount(Math.min(dismissed.size, MAX_DISMISSED_SUGGESTIONS));
      setSuggestions(current => current.filter(suggestion => suggestion.id !== id));
      return;
    }
    try {
      const item = suggestions.find(suggestion => suggestion.id === id);
      if (!item) return;
      const response = await authorizedFetch('/admin/discovery/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.Error || 'No se pudo actualizar la sugerencia');
      setSuggestions(current => current.filter(suggestion => suggestion.id !== id));
      const stored = readLocalDiscovery();
      if (stored) {
        writeLocalDiscovery(
          stored.suggestions.filter(suggestion => suggestionKey(suggestion) !== suggestionKey(item)),
          stored.resultados || [],
          stored.savedAt,
          stored.sourceIds || []
        );
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const restoreDismissedSuggestions = async () => {
    try {
      window.localStorage.removeItem(DISMISSED_SUGGESTIONS_KEY);
    } catch {}
    setDismissedCount(0);
    setError('');
    try {
      await loadSuggestions();
      setMessage('Sugerencias ocultadas restauradas en este navegador.');
    } catch (err) {
      setError(err.message);
    }
  };

  const clearLocalDiscovery = () => {
    try {
      window.localStorage.removeItem(DISCOVERY_RESULTS_KEY);
      window.localStorage.removeItem(DISMISSED_SUGGESTIONS_KEY);
    } catch {}
    setSuggestions([]);
    setDismissedCount(0);
    setSources(current => current.map(source => ({ ...source, ultimoEstado: null, ultimoError: null })));
    setMessage('Resultados locales eliminados. La próxima búsqueda volverá a consultar las fuentes.');
  };

  const deleteIdea = async idea => {
    if (!confirm(`¿Eliminar definitivamente “${idea.titulo}”?`)) return;
    try {
      const response = await authorizedFetch(`/ideas?id=${idea.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.Error || 'No se pudo eliminar el plan');
      setIdeas(current => current.filter(item => item.id !== idea.id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (authLoading) return <p className="text-sage-dim">Verificando permisos...</p>;
  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <h1 className="font-logo text-3xl text-sage mb-3">ACCESO RESTRINGIDO</h1>
        <p className="text-sage-dim">Esta sección es sólo para administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-sage-dim mb-2">Administración</p>
        <h1 className="font-logo text-4xl text-sage">PLANES Y DESCUBRIMIENTO</h1>
      </header>

      <div className="flex gap-2 border-b border-border pb-3">
        <button onClick={() => setSection('suggestions')} className={`px-4 py-2 rounded-lg cursor-pointer ${section === 'suggestions' ? 'bg-accent text-white' : 'bg-card text-sage-dim'}`}>Descubrir planes</button>
        <button onClick={() => setSection('plans')} className={`px-4 py-2 rounded-lg cursor-pointer ${section === 'plans' ? 'bg-accent text-white' : 'bg-card text-sage-dim'}`}>Administrar planes</button>
      </div>

      {error && <div role="alert" className="bg-red-900/30 text-red-300 border border-red-800/50 rounded-xl p-4">{error}</div>}
      {message && <div role="status" className="bg-sage/10 text-sage border border-sage/20 rounded-xl p-4">{message}</div>}

      {section === 'suggestions' ? (
        <>
          <section className="bg-card border border-border rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-bold text-light text-lg">Fuentes a consultar</h2>
                <p className="text-sm text-sage-dim">Los resultados permanecen en este navegador hasta que los apruebes.</p>
              </div>
              <button onClick={runDiscovery} disabled={running || selectedSources.length === 0 || extensionStatus !== 'ready'} className="bg-accent hover:bg-accent-light text-white px-5 py-2.5 rounded-lg disabled:opacity-50 cursor-pointer">
                {running ? 'Buscando...' : 'Buscar nuevos eventos'}
              </button>
            </div>
            <div className={`mb-4 rounded-lg border px-3 py-2 text-sm ${extensionStatus === 'ready' ? 'border-sage/30 bg-sage/10 text-sage' : extensionStatus === 'missing' ? 'border-amber-700/50 bg-amber-900/20 text-amber-200' : 'border-border bg-surface/50 text-sage-dim'}`}>
              {extensionStatus === 'ready' ? (
                <>Recolector local conectado{extensionVersion ? ` · versión ${extensionVersion}` : ''}. El scraping no utiliza Railway.</>
              ) : extensionStatus === 'missing' ? (
                <span>
                  Recolector local no detectado. Instala la carpeta <code>browser-extension</code>, recarga esta página y luego{' '}
                  <button type="button" onClick={() => { setError(''); loadSources().catch(err => { setExtensionStatus('missing'); setError(err.message); }); }} className="underline cursor-pointer">verifica nuevamente</button>.
                </span>
              ) : 'Buscando el recolector local...'}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {sources.map(source => (
                <label key={source.id} className="flex items-start gap-2 bg-surface/60 border border-border rounded-lg p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSources.includes(source.id)}
                    onChange={() => setSelectedSources(current => current.includes(source.id) ? current.filter(id => id !== source.id) : [...current, source.id])}
                    className="mt-1 accent-sage"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm text-light">{source.nombre}</span>
                    <span className={`text-xs ${source.ultimoEstado === 'ERROR' ? 'text-red-400' : source.ultimoEstado === 'PARCIAL' ? 'text-amber-300' : 'text-sage-dim'}`}>
                      {source.ultimoEstado || 'Sin consultar'}{source.ultimoError ? ` · ${source.ultimoError}` : ''}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-sage-dim mt-4">Se muestran como máximo 2 alternativas del mismo evento. Nexus está excluido de tus sugerencias.</p>
            <p className="text-xs text-sage-dim mt-2">El descubrimiento automático prioriza carteleras web con fechas verificables; los perfiles de Instagram ya no se consultan.</p>
            <p className="text-xs text-sage-dim mt-2">Modo local: la extensión descarga y procesa las fuentes en este computador. Los candidatos se guardan durante 6 horas y el scraping no llega a Railway ni a PostgreSQL.</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <p className="text-xs text-sage-dim">“Ocultar” sólo modifica este navegador: no envía solicitudes ni escribe en la base de datos.</p>
              {dismissedCount > 0 && (
                <button type="button" onClick={restoreDismissedSuggestions} className="text-xs text-sage hover:underline cursor-pointer">
                  Restaurar {dismissedCount} ocultadas
                </button>
              )}
              <button type="button" onClick={clearLocalDiscovery} className="text-xs text-sage hover:underline cursor-pointer">
                Limpiar resultados locales
              </button>
            </div>
          </section>

          {buckets.map(bucket => (
            <section key={bucket.key}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-logo text-2xl text-sage">{bucket.title}</h2>
                <span className="text-sm text-sage-dim">{bucket.items.length}</span>
              </div>
              {bucket.items.length === 0 ? (
                <p className="bg-card/40 border border-border rounded-xl p-5 text-sage-dim">No hay candidatos pendientes en este período.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {bucket.items.map(item => (
                    <article key={item.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col">
                      <div className="flex justify-between gap-4 mb-2">
                        <h3 className="font-bold text-light leading-snug">{item.titulo}</h3>
                        <span className="text-xs text-sage shrink-0">{item.confianza}%</span>
                      </div>
                      <p className="text-sm text-sage mb-1">{formatEventRange(item.fecha, item.fechaFin)}</p>
                      <p className="text-sm text-sage-dim mb-1">{item.ubicacion}</p>
                      <p className="text-sm text-sage-dim mb-3">{priceLabel(item)}</p>
                      {item.descripcion && <p className="text-sm text-sage-dim line-clamp-3 mb-3">{item.descripcion}</p>}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {item.tags.map(tag => <span key={tag} className="text-xs bg-surface border border-border rounded-full px-2 py-1 text-sage-dim">{tag}</span>)}
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-border">
                        <a href={item.fuenteUrl} target="_blank" rel="noreferrer" className="text-xs text-sage hover:underline truncate">{item.fuenteNombre}</a>
                        <div className="flex gap-2">
                          <button onClick={() => suggestionAction(item.id, 'reject')} className="text-sm px-3 py-2 rounded-lg bg-surface text-sage-dim hover:text-red-300 cursor-pointer">Ocultar</button>
                          <button onClick={() => suggestionAction(item.id, 'approve')} className="text-sm px-3 py-2 rounded-lg bg-accent text-white hover:bg-accent-light cursor-pointer">Aprobar</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </>
      ) : (
        <section>
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              ['expired', 'Vencidos'],
              ['active', 'Activos'],
              ['undated', 'Sin fecha']
            ].map(([value, label]) => (
              <button key={value} onClick={() => setPlanStatus(value)} className={`px-4 py-2 rounded-lg cursor-pointer ${planStatus === value ? 'bg-sage text-dark' : 'bg-card text-sage-dim'}`}>{label}</button>
            ))}
          </div>
          {loading ? <p className="text-sage-dim">Cargando planes...</p> : ideas.length === 0 ? (
            <p className="bg-card border border-border rounded-xl p-6 text-sage-dim">No hay planes en esta sección.</p>
          ) : (
            <div className="space-y-3">
              {ideas.map(idea => (
                <article key={idea.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-light truncate">{idea.titulo}</h3>
                    <p className="text-sm text-sage-dim">{idea.fecha ? formatEventRange(idea.fecha, idea.fechaFin) : 'Plan permanente · sin fecha'}</p>
                    <p className="text-sm text-sage-dim truncate">{idea.ubicacion}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setEditing(idea)} className="px-3 py-2 rounded-lg bg-surface text-sage hover:bg-card-hover cursor-pointer">Editar</button>
                    <button onClick={() => deleteIdea(idea)} className="px-3 py-2 rounded-lg bg-red-900/30 text-red-300 hover:bg-red-900/50 cursor-pointer">Eliminar</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {editing && (
        <EditIdeaModal
          idea={editing}
          onClose={() => setEditing(null)}
          onUpdated={() => { setEditing(null); loadIdeas(); }}
          apiUrl={API_URL}
          getToken={getToken}
        />
      )}
    </div>
  );
}
