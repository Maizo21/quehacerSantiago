'use client';

import { useState } from 'react';
import TagSelector from '@/components/TagSelector';

export default function EditIdeaModal({ idea, onClose, onUpdated, apiUrl, getToken }) {
  const [form, setForm] = useState({
    titulo: idea.titulo,
    descripcion: idea.descripcion || '',
    ubicacion: idea.ubicacion,
    fecha: idea.fecha ? idea.fecha.split('T')[0] : '',
    destacado: idea.destacado || false
  });
  const [selectedTags, setSelectedTags] = useState(idea.tags || []);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(
    idea.imagenUrl || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('titulo', form.titulo);
    formData.append('descripcion', form.descripcion);
    formData.append('ubicacion', form.ubicacion);
    formData.append('tags', selectedTags.join(','));
    if (form.fecha) formData.append('fecha', form.fecha);
    formData.append('destacado', form.destacado);
    if (image) formData.append('imagen', image);

    try {
      const token = await getToken();
      const res = await fetch(`${apiUrl}/ideas?id=${idea.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        onUpdated();
        onClose();
      } else {
        const data = await res.json();
        setError(data.Error || 'Error al actualizar el plan');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Editar plan"
    >
      <div
        className="bg-surface border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-xl text-sage">EDITAR PLAN</h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-titulo" className="block text-sm font-medium text-sage-dim mb-1">
              Título del plan *
            </label>
            <input
              id="edit-titulo"
              type="text"
              required
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-light placeholder-sage-dim/50 focus:outline-none focus:ring-2 focus:ring-sage/50"
              placeholder="Ej: Picnic en el Parque Bicentenario"
            />
          </div>

          <div>
            <label htmlFor="edit-descripcion" className="block text-sm font-medium text-sage-dim mb-1">
              Descripción
            </label>
            <textarea
              id="edit-descripcion"
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-light placeholder-sage-dim/50 focus:outline-none focus:ring-2 focus:ring-sage/50"
              rows={3}
              placeholder="Detalles adicionales del plan..."
            />
          </div>

          <div>
            <label htmlFor="edit-ubicacion" className="block text-sm font-medium text-sage-dim mb-1">
              Ubicación *
            </label>
            <input
              id="edit-ubicacion"
              type="text"
              required
              value={form.ubicacion}
              onChange={e => setForm({ ...form, ubicacion: e.target.value })}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-light placeholder-sage-dim/50 focus:outline-none focus:ring-2 focus:ring-sage/50"
              placeholder="Ej: Providencia, Santiago"
            />
          </div>

          <div>
            <label id="edit-tags" className="block text-sm font-medium text-sage-dim mb-2">
              Etiquetas *
            </label>
            <TagSelector selected={selectedTags} onChange={setSelectedTags} id="edit-tags" />
          </div>

          <div>
            <label htmlFor="edit-fecha" className="block text-sm font-medium text-sage-dim mb-1">
              Fecha <span className="font-normal text-sage-dim/50">(opcional)</span>
            </label>
            <input
              id="edit-fecha"
              type="date"
              value={form.fecha}
              onChange={e => setForm({ ...form, fecha: e.target.value })}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-light focus:outline-none focus:ring-2 focus:ring-sage/50"
            />
          </div>

          <div>
            <label htmlFor="edit-imagen" className="block text-sm font-medium text-sage-dim mb-1">
              Imagen <span className="font-normal text-sage-dim/50">(opcional, reemplaza la actual)</span>
            </label>
            <input
              id="edit-imagen"
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
              id="edit-destacado"
              checked={form.destacado}
              onChange={e => setForm({ ...form, destacado: e.target.checked })}
              className="w-4 h-4 rounded accent-sage cursor-pointer"
            />
            <label htmlFor="edit-destacado" className="text-sm text-sage-dim cursor-pointer">
              Marcar como plan destacado
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-light py-2.5 rounded-lg font-medium hover:bg-accent-light disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
