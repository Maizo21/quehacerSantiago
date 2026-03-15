'use client';

const AVAILABLE_TAGS = (process.env.NEXT_PUBLIC_AVAILABLE_TAGS || '')
  .split(',')
  .map(t => t.trim())
  .filter(Boolean);

export default function TagSelector({ selected = [], onChange, id }) {
  const toggle = (tag) => {
    if (selected.includes(tag)) {
      onChange(selected.filter(t => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby={id}>
        {AVAILABLE_TAGS.map(tag => {
          const isSelected = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={`text-sm px-3 py-1.5 rounded-full border transition cursor-pointer ${
                isSelected
                  ? 'bg-sage/25 text-sage border-sage/40 font-medium'
                  : 'bg-card text-sage-dim border-border hover:border-sage/30 hover:text-sage'
              }`}
              aria-pressed={isSelected}
            >
              {tag}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-sage-dim/50 mt-1.5">Selecciona al menos una etiqueta</p>
      )}
    </div>
  );
}

export { AVAILABLE_TAGS };
