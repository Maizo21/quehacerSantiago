'use client';

import { useState } from 'react';

export default function AddIdeaModal({ onClose, onCreated, apiUrl, getToken }) {
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    ubicacion: '',
    tags: '',
    fecha: '',
    destacado: false
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
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
    if (form.descripcion) formData.append('descripcion', form.descripcion);
    formData.append('ubicacion', form.ubicacion);
    formData.append('tags', form.tags);
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
            <label htmlFor="add-tags" className="block text-sm font-medium text-sage-dim mb-1">
              Etiquetas * <span className="font-normal text-sage-dim/50">(separadas por coma)</span>
            </label>
            <input
              id="add-tags"
              type="text"
              required
              value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-light placeholder-sage-dim/50 focus:outline-none focus:ring-2 focus:ring-sage/50"
              placeholder="outdoor, económico, pareja"
            />
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
            className="w-full bg-accent text-light py-2.5 rounded-lg font-medium hover:bg-accent-light disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? 'Guardando...' : 'Guardar plan'}
          </button>
        </form>
      </div>
    </div>
  );
}
