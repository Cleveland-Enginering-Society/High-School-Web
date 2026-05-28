'use client';

// Written by Evan Dan


import Link from 'next/link';
import { useMemo, useState } from 'react';

export interface CalendarEvent {
  id: string;
  event_name: string;
  event_start_time: string;
  event_location: string;
}

function getLocalDateKey(iso: string): string {
  const d = new Date(iso);
  return dateToLocalKey(d);
}

function dateToLocalKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function EventsCalendar({ events }: { events: CalendarEvent[] }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = getLocalDateKey(event.event_start_time);
      const existing = map.get(key) ?? [];
      existing.push(event);
      map.set(key, existing);
    }
    return map;
  }, [events]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ date: Date | null; key: string | null }> = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: null, key: null });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      cells.push({ date, key: dateToLocalKey(date) });
    }
    return cells;
  }, [visibleMonth]);

  const selectedEvents = selectedDateKey ? eventsByDate.get(selectedDateKey) ?? [] : [];

  const shiftMonth = (delta: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
    setSelectedDateKey(null);
  };

  const todayKey = dateToLocalKey(new Date());

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="px-3 py-1 text-sm font-medium text-[#00539eff] hover:bg-white rounded transition-colors"
          aria-label="Previous month"
        >
          ←
        </button>
        <h3 className="text-lg font-semibold text-gray-900">{formatMonthYear(visibleMonth)}</h3>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="px-3 py-1 text-sm font-medium text-[#00539eff] hover:bg-white rounded transition-colors"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="bg-gray-50 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            {label}
          </div>
        ))}

        {calendarDays.map((cell, index) => {
          if (!cell.date || !cell.key) {
            return <div key={`empty-${index}`} className="bg-white min-h-[3.25rem]" />;
          }

          const dayEvents = eventsByDate.get(cell.key) ?? [];
          const isToday = cell.key === todayKey;
          const isSelected = cell.key === selectedDateKey;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => setSelectedDateKey(cell.key)}
              className={`bg-white min-h-[3.25rem] p-1.5 text-left transition-colors hover:bg-blue-50 ${
                isSelected ? 'ring-2 ring-inset ring-[#00539eff] bg-blue-50' : ''
              }`}
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                  isToday ? 'bg-[#00539eff] text-white font-semibold' : 'text-gray-900'
                }`}
              >
                {cell.date.getDate()}
              </span>
              {dayEvents.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span
                      key={event.id}
                      className="h-1.5 w-1.5 rounded-full bg-[#00539eff]"
                      title={event.event_name}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-4 border-t border-gray-200 min-h-[5rem]">
        {selectedDateKey ? (
          selectedEvents.length > 0 ? (
            <ul className="space-y-3">
              {selectedEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.id}/signup`}
                    className="block hover:text-[#00539eff] transition-colors"
                  >
                    <p className="font-semibold text-gray-900">{event.event_name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.event_start_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      · {event.event_location}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No events on this date.</p>
          )
        ) : (
          <p className="text-sm text-gray-500">Select a date to view events.</p>
        )}
      </div>
    </div>
  );
}

export { getLocalDateKey };
