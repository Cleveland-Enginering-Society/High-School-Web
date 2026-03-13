'use client';

import { useState, useRef, useEffect } from 'react';

interface InfoTooltipProps {
  description: string;
  /** Optional id for the trigger so multiple tooltips on the same page don't conflict. */
  id?: string;
}

export function InfoTooltip({ description, id }: InfoTooltipProps) {
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const visible = hovering || pinned;

  useEffect(() => {
    if (!pinned) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPinned(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pinned]);

  return (
    <span
      ref={containerRef}
      className="relative inline-block ml-2 align-middle"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <button
        type="button"
        onClick={() => setPinned((prev) => !prev)}
        aria-expanded={visible}
        aria-label="More information"
        id={id}
        className="text-gray-500 cursor-pointer hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full w-5 h-5 inline-flex items-center justify-center text-xs font-medium"
      >
        (?)
      </button>
      {visible && (
        <span
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg z-50 w-56 max-w-[min(16rem,85vw)] text-left shadow-lg"
          style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
        >
          {description}
        </span>
      )}
    </span>
  );
}
