'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const CANDIDATE_PATHS = ['/', '/lots', '/iot', '/alertes', '/exploitations', '/analytique', '/parametres'];
const STORAGE_KEY = 'coffee-bean-target';
const CLICKS_TO_TRIGGER = 5;
const CLICK_WINDOW_MS = 1000;

interface BeanTarget {
  path: string;
  xPercent: number;
  yPercent: number;
}

function pickTarget(): BeanTarget {
  const path = CANDIDATE_PATHS[Math.floor(Math.random() * CANDIDATE_PATHS.length)];
  const xPercent = 5 + Math.random() * 85;
  const yPercent = 10 + Math.random() * 75;
  return { path, xPercent, yPercent };
}

function getOrCreateTarget(): BeanTarget {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as BeanTarget;
    } catch {
      // fall through and create a fresh target below
    }
  }
  const target = pickTarget();
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(target));
  return target;
}

export default function CoffeeBeanTrigger() {
  const pathname = usePathname();
  const router = useRouter();
  const [target, setTarget] = useState<BeanTarget | null>(null);
  const clickTimestamps = useRef<number[]>([]);

  // Resolved from sessionStorage, which is client-only, so it must run after
  // mount rather than during render/init.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deferred one-time sync from persisted storage
    setTarget(getOrCreateTarget());
  }, []);

  if (!target || target.path !== pathname) {
    return null;
  }

  function handleClick() {
    const now = Date.now();
    clickTimestamps.current = [...clickTimestamps.current, now].filter(
      (t) => now - t <= CLICK_WINDOW_MS
    );
    if (clickTimestamps.current.length >= CLICKS_TO_TRIGGER) {
      clickTimestamps.current = [];
      router.push('/secret');
    }
  }

  return (
    <button
      type="button"
      aria-label="coffee-bean"
      onClick={handleClick}
      className="fixed z-50 opacity-60 hover:opacity-100 transition-opacity"
      style={{ left: `${target.xPercent}%`, top: `${target.yPercent}%` }}
    >
      <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
        <ellipse cx="9" cy="12" rx="8" ry="11.5" fill="var(--color-espresso-700)" />
        <path d="M9 1.5C6.3 7 6.3 17 9 22.5" stroke="var(--color-parchment-200)" strokeWidth="1.5" fill="none" />
      </svg>
    </button>
  );
}
