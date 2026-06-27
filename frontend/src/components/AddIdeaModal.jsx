'use client';

import { useState } from 'react';
import TagSelector from '@/components/TagSelector';

const AVAILABLE_TAGS = (process.env.NEXT_PUBLIC_AVAILABLE_TAGS || '')
  .split(',')
  .map(t => t.trim())
  .filter(Boolean);

async function dataUriToFile(dataUri, filename = 'imported.jpg') {
  const res = await fetch(dataUri);
  const blob = await res.blob();
  const ext = (blob.type.split('/')[1] || 'jpg').split(';')[0];
  return new File([blob], `${filename.replace(/\.[^.]+$/, '')}.${ext}`, { type: blob.type });
}

export default function AddIdeaModal({ onClose, onCreated, apiUrl, getToken }) {
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    ubicacion: '',
    fecha: '',
    destacado: false
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSource, setImportSource] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError('');
    setImportSource('');
    try {
      const token = await getToken();
      const res = await fetch(`${apiUrl}/importar-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ url: importUrl.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.Error || 'Error al importar la URL');
        return;
      }

      setForm(prev => ({
        ...prev,
        titulo: data.titulo || prev.titulo,
        descripcion: data.descripcion || prev.descripcion,
        ubicacion: data.ubicacion || prev.ubicacion
      }));

      if (Array.isArray(data.tags) && data.tags.length > 0) {
        const matched = data.tags
          .map(t => t.toLowerCase().trim())
          .map(t => AVAILABLE_TAGS.find(at => at.toLowerCase() === t))
          .filter(Boolean);
        if (matched.length > 0) {
          setSelectedTags(prev => Array.from(new Set([...prev, ...matched])));
        }
      }

      if (data.imagenBase64) {
        try {
          const file = await dataUriToFile(data.imagenBase64, 'imported');
          setImage(file);
          setPreview(data.imagenBase64);
        } catch (_) {}
      }

      setImportSource(data.source || '');
    } catch {
      setImportError('Error de conexión con el servidor');
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('titulo', form.titulo);
    if (form.descripcion) formData.append('descripcion', form.descripcion);
    formData.append('ubicacion', form.ubicacion);
    formData.append('tags', selectedTags.join(','));
    if (form.fecha) formData.append('fecha', form.fecha);
    formData.append('destacado', form.destacado);
    if (image) formData.append('imagen', image);

    try {
      const token = await getToken();
      const res = await fetch(`${apiUrl}/ideas`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        onCreated();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al crear el plan');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label="Agregar nuevo plan">
      <div
        className="bg-surface border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-xl text-sage">AGREGAR NUEVO PLAN</h2>
          <button
            onClick={onClose}
            className="text-sage-dim hover:text-light text-2xl leading-none cursor-pointer"
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>

        {error && (
          <div role="alert" className="bg-red-900/30 text-red-400 border border-red-800/50 text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <details className="bg-card/50 border border-sage/20 rounded-lg mb-5 group">
          <summary className="px-3 py-2.5 cursor-pointer text-sm text-sage hover:text-sage/80 font-medium flex items-center gap-2 list-none">
            <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Importar desde una URL (auto-rellena el formulario)
          </summary>
          <div className="p-3 pt-2 border-t border-sage/15 space-y-2">
            <p className="text-xs text-sage-dim">
              Pega una URL de blog, artículo o post sobre un plan en Santiago. La IA extrae título, ubicación, descripción e imagen.
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                placeholder="https://santiagoadicto.com/..."
                className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-light placeholder-sage-dim/50 focus:outline-none focus:ring-2 focus:ring-sage/50"
                disabled={importing}
              />
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || !importUrl.trim()}
                className="bg-sage/15 text-sage border border-sage/30 px-3 py-2 rounded-lg text-sm font-medium hover:bg-sage/25 disabled:opacity-50 transition cursor-pointer whitespace-nowrap"
              >
                {importing ? 'Importando...' : 'Importar'}
              </button>
            </div>
            {importError && (
              <p role="alert" className="text-xs text-red-400">{importError}</p>
            )}
            {importSource && !importError && (
              <p className="text-xs text-sage-dim">✓ Importado desde <strong>{importSource}</strong>. Revisa y edita los campos antes de guardar.</p>
            )}
          </div>
        </details>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="add-titulo" className="block text-sm font-medium text-sage-dim mb-1">
              Título del plan *
            </label>
            <input
              id="add-titulo"
              type="text"
              required
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-light placeholder-sage-dim/50 focus:outline-none focus:ring-2 focus:ring-sage/50"
              placeholder="Ej: Picnic en el Parque Bicentenario"
            />
          </div>

          <div>
            <label htmlFor="add-descripcion" className="block text-sm font-medium text-sage-dim mb-1">
              Descripción
            </label>
            <textarea
              id="add-descripcion"
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-light placeholder-sage-dim/50 focus:outline-none focus:ring-2 focus:ring-sage/50"
              rows={3}
              placeholder="Detalles adicionales del plan..."
            />
          </div>

          <div>
            <label htmlFor="add-ubicacion" className="block text-sm font-medium text-sage-dim mb-1">
              Ubicación *
            </label>
            <input
              id="add-ubicacion"
              type="text"
              required
              value={form.ubicacion}
              onChange={e => setForm({ ...form, ubicacion: e.target.value })}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-light placeholder-sage-dim/50 focus:outline-none focus:ring-2 focus:ring-sage/50"
              placeholder="Ej: Providencia, Santiago"
            />
          </div>

          <div>
            <label id="add-tags" className="block text-sm font-medium text-sage-dim mb-2">
              Etiquetas *
            </label>
            <TagSelector selected={selectedTags} onChange={setSelectedTags} id="add-tags" />
          </div>

          <div>
            <label htmlFor="add-fecha" className="block text-sm font-medium text-sage-dim mb-1">
              Fecha <span className="font-normal text-sage-dim/50">(opcional)</span>
            </label>
            <input
              id="add-fecha"
              type="date"
              value={form.fecha}
              onChange={e => setForm({ ...form, fecha: e.target.value })}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-light focus:outline-none focus:ring-2 focus:ring-sage/50"
            />
          </div>

          <div>
            <label htmlFor="add-imagen" className="block text-sm font-medium text-sage-dim mb-1">
              Imagen <span className="font-normal text-sage-dim/50">(opcional)</span>
            </label>
            <input
              id="add-imagen"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-sage-dim file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sage/15 file:text-sage hover:file:bg-sage/25 file:cursor-pointer"
            />
            {preview && (
              <img
                src={preview}
                alt="Vista previa de la imagen del plan"
                className="mt-2 h-32 w-full object-cover rounded-lg border border-border"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="destacado"
              checked={form.destacado}
              onChange={e => setForm({ ...form, destacado: e.target.checked })}
              className="w-4 h-4 rounded accent-sage cursor-pointer"
            />
            <label htmlFor="destacado" className="text-sm text-sage-dim cursor-pointer">
              Marcar como plan destacado
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white py-2.5 rounded-lg font-medium hover:bg-accent-light disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? 'Guardando...' : 'Guardar plan'}
          </button>
        </form>
      </div>
    </div>
  );
}
