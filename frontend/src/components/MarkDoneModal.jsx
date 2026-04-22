'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function MarkDoneModal({ ideaId, ideaTitle, onClose, onMarked, getToken }) {
  const today = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(today);
  const [nota, setNota] = useState('');
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('ideaId', ideaId);
    formData.append('fecha', fecha);
    if (nota) formData.append('nota', nota);
    if (foto) formData.append('foto', foto);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/mis-planes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        onMarked();
        onClose();
      } else {
        const data = await res.json();
        setError(data.Error || 'Error al registrar el plan');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label="Marcar plan como realizado">
      <div
        className="bg-surface border border-border rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-lg text-sage">PLAN REALIZADO</h2>
          <button
            onClick={onClose}
            className="text-sage-dim hover:text-light text-2xl leading-none cursor-pointer"
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>

        <p className="text-light text-sm mb-4">
          Registrar <strong>{ideaTitle}</strong> como plan realizado
        </p>

        {error && (
          <div role="alert" className="bg-red-900/30 text-red-400 border border-red-800/50 text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="done-fecha" className="block text-sm font-medium text-sage-dim mb-1">
              Fecha en que lo hiciste *
            </label>
            <input
              id="done-fecha"
              type="date"
              required
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-light focus:outline-none focus:ring-2 focus:ring-sage/50"
            />
          </div>

          <div>
            <label htmlFor="done-nota" className="block text-sm font-medium text-sage-dim mb-1">
              Nota <span className="font-normal text-sage-dim/50">(opcional)</span>
            </label>
            <textarea
              id="done-nota"
              value={nota}
              onChange={e => setNota(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-light placeholder-sage-dim/50 focus:outline-none focus:ring-2 focus:ring-sage/50"
              rows={2}
              placeholder="Ej: Fuimos con la familia, estuvo genial..."
              maxLength={500}
            />
          </div>

          <div>
            <label htmlFor="done-foto" className="block text-sm font-medium text-sage-dim mb-1">
              Foto del momento <span className="font-normal text-sage-dim/50">(opcional)</span>
            </label>
            <input
              id="done-foto"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-sage-dim file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sage/15 file:text-sage hover:file:bg-sage/25 file:cursor-pointer"
            />
            {preview && (
              <img
                src={preview}
                alt="Vista previa de la foto"
                className="mt-2 h-32 w-full object-cover rounded-lg border border-border"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white py-2.5 rounded-lg font-medium hover:bg-accent-light disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? 'Guardando...' : 'Registrar como realizado'}
          </button>
        </form>
      </div>
    </div>
  );
}
