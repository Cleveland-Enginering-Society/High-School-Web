"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Event {
  id: string;
  event_name: string;
  event_time: string;
  event_location: string;
}

export default function EventsPreview() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        setEvents(data.events?.slice(0, 3) || []); // show only 3
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading events...</p>;
  }

  if (events.length === 0) {
    return <p className="text-gray-500">No upcoming events.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/events`}
          className="border border-gray-300 rounded-lg p-5 hover:border-[#00539eff] transition"
        >
          <h3 className="text-lg font-semibold text-[#00539eff] mb-2">
            {event.event_name}
          </h3>
          <p className="text-sm text-gray-600">
            {new Date(event.event_time).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">
            {event.event_location}
          </p>
        </Link>
      ))}
    </div>
  );
}
