'use client';

// Written by Evan Dan


import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EVENT_STATUS, normalizeEventStatus } from '@/lib/eventStatus';
import EventsCalendar, { CalendarEvent } from '@/components/home/EventsCalendar';

type EventsView = 'list' | 'calendar';

function formatListDate(dateString: string) {
  const date = new Date(dateString);
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    day: date.getDate(),
    full: date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

function EventsList({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) {
    return <p className="text-gray-500">No upcoming events.</p>;
  }

  return (
    <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white overflow-hidden">
      {events.map((event) => {
        const dateParts = formatListDate(event.event_start_time);
        return (
          <Link
            key={event.id}
            href={`/events/${event.id}/signup`}
            className="flex gap-5 sm:gap-8 p-5 sm:p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="shrink-0 text-center min-w-[4.5rem]">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#00539eff]">
                {dateParts.month}
              </p>
              <p className="text-3xl font-bold leading-none text-gray-900">{dateParts.day}</p>
            </div>
            <div className="min-w-0 pt-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.event_name}</h3>
              <p className="text-sm text-gray-600">{dateParts.full}</p>
              <p className="text-sm text-gray-600 mt-1">
                {dateParts.time} · {event.event_location}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function HomeEventsSection() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<EventsView>('list');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        const ongoing = (data.events || [])
          .filter(
            (event: CalendarEvent & { status?: string | null }) =>
              normalizeEventStatus(event.status) === EVENT_STATUS.ONGOING
          )
          .sort(
            (a: CalendarEvent, b: CalendarEvent) =>
              new Date(a.event_start_time).getTime() - new Date(b.event_start_time).getTime()
          );
        setEvents(ongoing);
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <section className="w-full py-16 md:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <h2 className="text-[#00539eff] text-3xl md:text-4xl font-bold tracking-wide">
            EVENTS
          </h2>
          <div className="flex gap-1 border border-gray-300 rounded-md p-1 self-start">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`px-4 py-1.5 text-sm font-semibold rounded transition-colors ${
                view === 'list'
                  ? 'bg-[#00539eff] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView('calendar')}
              className={`px-4 py-1.5 text-sm font-semibold rounded transition-colors ${
                view === 'calendar'
                  ? 'bg-[#00539eff] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading events...</p>
        ) : view === 'list' ? (
          <EventsList events={events} />
        ) : (
          <EventsCalendar events={events} />
        )}

        <div className="mt-8 text-right">
          <Link href="/events" className="text-[#00539eff] font-semibold hover:underline">
            View all events →
          </Link>
        </div>
      </div>
    </section>
  );
}
