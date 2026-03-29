'use client';

import { useState, useRef } from 'react';

const DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function CalendarGrid({ year, month, plans, selectedDay, onSelectDay, onPrevMonth, onNextMonth }) {
  const [tooltipDay, setTooltipDay] = useState(null);
  const tooltipRef = useRef(null);

  // Primer día del mes (0=Dom, 1=Lun...) — ajustamos para que Lunes=0
  const firstDay = new Date(year, month - 1, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = today.getDate();

  // Agrupar planes por día
  const plansByDay = {};
  plans.forEach(p => {
    const day = new Date(p.fecha).getDate();
    if (!plansByDay[day]) plansByDay[day] = [];
    plansByDay[day].push(p);
  });

  const cells = [];
  // Celdas vacías antes del primer día
  for (let i = 0; i < startOffset; i++) {
    cells.push(<div key={`empty-${i}`} className="h-12 sm:h-14" />);
  }

  // Celdas de cada día
  for (let day = 1; day <= daysInMonth; day++) {
    const count = plansByDay[day]?.length || 0;
    const isToday = isCurrentMonth && day === todayDate;
    const isSelected = day === selectedDay;

    cells.push(
      <button
        key={day}
        onClick={() => onSelectDay(day === selectedDay ? null : day)}
        onMouseEnter={() => count > 0 && setTooltipDay(day)}
        onMouseLeave={() => setTooltipDay(null)}
        className={`relative h-12 sm:h-14 rounded-lg flex flex-col items-center justify-center transition cursor-pointer text-sm font-medium
          ${isSelected ? 'bg-sage/20 text-sage border border-sage/40' : 'hover:bg-surface text-light/70 hover:text-light'}
          ${isToday && !isSelected ? 'ring-2 ring-sage/50' : ''}
        `}
        aria-label={`${day} de ${MONTHS[month - 1]}${count > 0 ? `, ${count} plan${count > 1 ? 'es' : ''} realizado${count > 1 ? 's' : ''}` : ''}`}
      >
        <span>{day}</span>
        {count > 0 && (
          <div className="flex gap-0.5 mt-0.5">
            {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-sage" />
            ))}
          </div>
        )}

        {/* Tooltip (desktop only) */}
        {tooltipDay === day && count > 0 && (
          <div
            ref={tooltipRef}
            className="hidden sm:block absolute -top-9 left-1/2 -translate-x-1/2 bg-card border border-border text-sage text-xs px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap z-10 pointer-events-none"
          >
            {count} plan{count > 1 ? 'es' : ''} realizado{count > 1 ? 's' : ''}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevMonth}
          className="text-sage-dim hover:text-sage p-2 rounded-lg hover:bg-surface transition cursor-pointer"
          aria-label="Mes anterior"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-bold text-lg text-sage">
          {MONTHS[month - 1]} {year}
        </h2>
        <button
          onClick={onNextMonth}
          className="text-sage-dim hover:text-sage p-2 rounded-lg hover:bg-surface transition cursor-pointer"
          aria-label="Mes siguiente"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-sage-dim py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>
    </div>
  );
}
