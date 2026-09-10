# Random Game Easter Egg Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hidden coffee-bean easter egg that, after 5 rapid clicks, sends the user to a secret page containing a small dino-runner mini-game (GitHub issue #28).

**Architecture:** A client component (`CoffeeBeanTrigger`) mounted globally in `ClientShell` picks one random route + random screen position per browser session (`sessionStorage`) and renders a clickable coffee-bean icon there. 5 rapid clicks navigate to `/secret`, a chrome-free page rendering `DinoRunner`, a self-contained `setInterval`-driven game component that persists the best score in `localStorage`.

**Tech Stack:** Next.js App Router (client components), React state/effects, Tailwind v4 theme tokens (`espresso-*`, `parchment-*`), existing `LanguageContext` i18n system, Jest + Testing Library.

## Global Constraints

- This is a modified Next.js fork (v16.2.9): `next/jest` must be imported as `next/jest.js` — the extensionless import is broken. Already fixed in Task 1.
- Follow existing color tokens only: `espresso-{50-950}` and `parchment-{0-700}` defined in `src/app/globals.css` `@theme inline` block. No new colors.
- All user-visible strings go through `useLanguage()` / `t('key')` and must have `fr`, `en`, `es` entries in `src/translations/index.ts`. `fr` is the default/fallback language, used by tests.
- Any component using `useLanguage()` must be rendered inside `<LanguageProvider>` in tests — the hook throws if not wrapped. (The codebase has pre-existing tests that skip this and are currently failing; do not follow that pattern for new tests.)
- Test runner: `npx jest <path>` for a single file, `npx jest` for everything. `jest.config.ts` maps `@/` to `src/` and mocks `framer-motion` (see `src/__mocks__/framer-motion.tsx`) — animations resolve instantly in tests, no need to wait on them.

---

### Task 1: Fix the broken `next/jest` import (chore, prerequisite)

**Files:**
- Modify: `jest.config.ts`

**Interfaces:** None — infra-only fix.

- [x] **Step 1: Fix the import**

`jest.config.ts` currently does `import nextJest from 'next/jest';`, which fails to resolve on this Next.js fork (confirmed: `node_modules/next/jest.js` exists, `node_modules/next/jest` does not). Change line 2 to:

```ts
import nextJest from 'next/jest.js';
```

- [x] **Step 2: Verify Jest runs**

Run: `npx jest src/__tests__/pages/Dashboard.test.tsx -v`
Expected: Jest executes (may still show pre-existing unrelated failures from missing `LanguageProvider` wrapping in old tests — that's expected and out of scope). What matters: no `ERR_MODULE_NOT_FOUND` for `next/jest`.

- [ ] **Step 3: Commit**

```bash
git add jest.config.ts
git commit -m "fix(test): resolve next/jest.js import on this Next.js fork"
```

---

### Task 2: Add game translation keys

**Files:**
- Modify: `src/translations/index.ts`

**Interfaces:**
- Produces: translation keys `game_score`, `game_instructions`, `game_over`, `game_best_score` — consumed by `DinoRunner` in Task 3.

- [ ] **Step 1: Add the four keys to each language block**

Open `src/translations/index.ts`. Inside the `fr` block, add (anywhere in the object, e.g. right after the opening `fr: {`):

```ts
    // Secret game
    "game_score": "Score",
    "game_instructions": "Cliquez ou appuyez sur Espace pour sauter",
    "game_over": "Partie terminée",
    "game_best_score": "Meilleur score",
```

Inside the `en` block, add:

```ts
    // Secret game
    "game_score": "Score",
    "game_instructions": "Click or press Space to jump",
    "game_over": "Game over",
    "game_best_score": "Best score",
```

Inside the `es` block, add:

```ts
    // Secret game
    "game_score": "Puntuación",
    "game_instructions": "Haz clic o pulsa Espacio para saltar",
    "game_over": "Fin de la partida",
    "game_best_score": "Mejor puntuación",
```

- [ ] **Step 2: Verify the file still parses**

Run: `npx tsc --noEmit`
Expected: no new errors related to `src/translations/index.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/translations/index.ts
git commit -m "feat(i18n): add translation keys for the secret dino game"
```

---

### Task 3: Build `DinoRunner` game component (TDD)

**Files:**
- Create: `src/components/game/DinoRunner.tsx`
- Test: `src/__tests__/components/DinoRunner.test.tsx`

**Interfaces:**
- Consumes: `useLanguage()` from `@/contexts/LanguageContext` (must be wrapped in `<LanguageProvider>` by the caller/test).
- Produces: `export default function DinoRunner(): JSX.Element`. No props. Renders a clickable game area with `role="button"` and `aria-label="dino-game"`. Persists best score to `localStorage` key `"dino-best-score"`.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/components/DinoRunner.test.tsx`:

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import DinoRunner from '@/components/game/DinoRunner';

function renderGame() {
  return render(
    <LanguageProvider>
      <DinoRunner />
    </LanguageProvider>
  );
}

describe('DinoRunner', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the ready screen with score and instructions before starting', () => {
    renderGame();
    expect(screen.getByRole('button', { name: 'dino-game' })).toBeInTheDocument();
    expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
    expect(screen.getByText('Cliquez ou appuyez sur Espace pour sauter')).toBeInTheDocument();
  });

  it('hides the instructions overlay once the game starts', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'dino-game' }));
    expect(screen.queryByText('Cliquez ou appuyez sur Espace pour sauter')).not.toBeInTheDocument();
  });

  it('increments the score every tick while playing', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'dino-game' }));
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.getByText(/Score: 5/)).toBeInTheDocument();
  });

  it('spawns an obstacle once enough ticks have elapsed', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'dino-game' }));
    act(() => {
      jest.advanceTimersByTime(1300);
    });
    expect(screen.getAllByTestId('obstacle').length).toBeGreaterThan(0);
    (Math.random as jest.Mock).mockRestore();
  });

  it('jumps over an obstacle on Space without ending the game', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'dino-game' }));
    act(() => {
      jest.advanceTimersByTime(1200);
    });
    act(() => {
      fireEvent.keyDown(window, { code: 'Space' });
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.queryByText('Partie terminée')).not.toBeInTheDocument();
    (Math.random as jest.Mock).mockRestore();
  });

  it('ends the game on collision and records the best score', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'dino-game' }));
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByText('Partie terminée')).toBeInTheDocument();
    expect(localStorage.getItem('dino-best-score')).not.toBeNull();
    (Math.random as jest.Mock).mockRestore();
  });

  it('shows the previous best score on the ready screen after a reload', () => {
    localStorage.setItem('dino-best-score', '42');
    renderGame();
    expect(screen.getByText(/Meilleur score: 42/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/__tests__/components/DinoRunner.test.tsx -v`
Expected: FAIL — `Cannot find module '@/components/game/DinoRunner'`.

- [ ] **Step 3: Implement `DinoRunner`**

Create `src/components/game/DinoRunner.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const TICK_MS = 100;
const GAME_WIDTH = 600;
const GAME_HEIGHT = 200;
const DINO_X = 40;
const DINO_SIZE = 28;
const OBSTACLE_WIDTH = 18;
const OBSTACLE_HEIGHT = 30;
const BASE_SPEED = 16;
const JUMP_DURATION_MS = 500;
const MIN_SPAWN_TICKS = 8;
const MAX_SPAWN_TICKS = 16;
const BEST_SCORE_KEY = 'dino-best-score';

interface Obstacle {
  id: number;
  x: number;
}

type Phase = 'ready' | 'playing' | 'gameover';

function randomSpawnTicks(): number {
  return MIN_SPAWN_TICKS + Math.floor(Math.random() * (MAX_SPAWN_TICKS - MIN_SPAWN_TICKS));
}

function readBestScore(): number {
  const raw = localStorage.getItem(BEST_SCORE_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

export default function DinoRunner() {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [isJumping, setIsJumping] = useState(false);
  const nextObstacleId = useRef(0);
  const ticksUntilSpawn = useRef(randomSpawnTicks());
  const jumpTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBestScore(readBestScore());
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;

    const interval = setInterval(() => {
      setScore((prevScore) => {
        const nextScore = prevScore + 1;
        const speed = BASE_SPEED + Math.floor(nextScore / 100) * 4;

        setObstacles((prevObstacles) => {
          let next = prevObstacles
            .map((o) => ({ ...o, x: o.x - speed }))
            .filter((o) => o.x + OBSTACLE_WIDTH > 0);

          ticksUntilSpawn.current -= 1;
          if (ticksUntilSpawn.current <= 0) {
            next = [...next, { id: nextObstacleId.current++, x: GAME_WIDTH }];
            ticksUntilSpawn.current = randomSpawnTicks();
          }

          return next;
        });

        return nextScore;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const collided = obstacles.some(
      (o) => !isJumping && o.x < DINO_X + DINO_SIZE && o.x + OBSTACLE_WIDTH > DINO_X
    );
    if (collided) {
      setPhase('gameover');
    }
  }, [obstacles, isJumping, phase]);

  useEffect(() => {
    if (phase !== 'gameover') return;
    setBestScore((prev) => {
      if (score > prev) {
        localStorage.setItem(BEST_SCORE_KEY, String(score));
        return score;
      }
      return prev;
    });
  }, [phase, score]);

  useEffect(() => {
    return () => {
      if (jumpTimeout.current) clearTimeout(jumpTimeout.current);
    };
  }, []);

  function startGame() {
    setScore(0);
    setObstacles([]);
    setIsJumping(false);
    nextObstacleId.current = 0;
    ticksUntilSpawn.current = randomSpawnTicks();
    setPhase('playing');
  }

  function jump() {
    setIsJumping(true);
    if (jumpTimeout.current) clearTimeout(jumpTimeout.current);
    jumpTimeout.current = setTimeout(() => setIsJumping(false), JUMP_DURATION_MS);
  }

  function handleAction() {
    if (phase === 'playing') {
      if (!isJumping) jump();
    } else {
      startGame();
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        handleAction();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div
      role="button"
      aria-label="dino-game"
      tabIndex={0}
      onClick={handleAction}
      className="relative mx-auto bg-parchment-0 border border-parchment-400 rounded-lg overflow-hidden select-none cursor-pointer"
      style={{ width: GAME_WIDTH, height: GAME_HEIGHT, maxWidth: '100%' }}
    >
      <div
        data-testid="dino"
        className="absolute bottom-4 bg-espresso-700 rounded-sm transition-transform"
        style={{
          left: DINO_X,
          width: DINO_SIZE,
          height: DINO_SIZE,
          transform: isJumping ? 'translateY(-50px)' : 'translateY(0)',
        }}
      />
      {obstacles.map((o) => (
        <div
          key={o.id}
          data-testid="obstacle"
          className="absolute bottom-4 bg-espresso-900"
          style={{ left: o.x, width: OBSTACLE_WIDTH, height: OBSTACLE_HEIGHT }}
        />
      ))}
      <div className="absolute top-2 right-3 font-body text-sm text-espresso-900">
        {t('game_score')}: {score}
      </div>
      {phase !== 'playing' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-parchment-0/90 px-4 text-center">
          {phase === 'gameover' && (
            <p className="font-display text-lg font-semibold text-espresso-900">{t('game_over')}</p>
          )}
          <p className="text-sm text-espresso-900">
            {t('game_score')}: {score} · {t('game_best_score')}: {bestScore}
          </p>
          <p className="text-sm text-parchment-700">{t('game_instructions')}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/__tests__/components/DinoRunner.test.tsx -v`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/game/DinoRunner.tsx src/__tests__/components/DinoRunner.test.tsx
git commit -m "feat(game): add DinoRunner mini-game component"
```

---

### Task 4: Build the `/secret` page

**Files:**
- Create: `src/app/secret/page.tsx`
- Test: `src/__tests__/pages/Secret.test.tsx`

**Interfaces:**
- Consumes: `DinoRunner` from Task 3 (default export, no props).
- Produces: `export default function SecretPage(): JSX.Element` at route `/secret`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/pages/Secret.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import SecretPage from '@/app/secret/page';

describe('SecretPage', () => {
  it('renders the dino game', () => {
    render(
      <LanguageProvider>
        <SecretPage />
      </LanguageProvider>
    );
    expect(screen.getByRole('button', { name: 'dino-game' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/__tests__/pages/Secret.test.tsx -v`
Expected: FAIL — `Cannot find module '@/app/secret/page'`.

- [ ] **Step 3: Implement the page**

Create `src/app/secret/page.tsx`:

```tsx
'use client';

import DinoRunner from '@/components/game/DinoRunner';

export default function SecretPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4" style={{ background: '#EFE7DA' }}>
      <DinoRunner />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/__tests__/pages/Secret.test.tsx -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/secret/page.tsx src/__tests__/pages/Secret.test.tsx
git commit -m "feat(game): add hidden /secret route hosting the dino game"
```

---

### Task 5: Build `CoffeeBeanTrigger` (TDD)

**Files:**
- Create: `src/components/game/CoffeeBeanTrigger.tsx`
- Test: `src/__tests__/components/CoffeeBeanTrigger.test.tsx`

**Interfaces:**
- Consumes: `usePathname`, `useRouter` from `next/navigation`.
- Produces: `export default function CoffeeBeanTrigger(): JSX.Element | null`. No props. Renders a `<button aria-label="coffee-bean">` only on the one page chosen for the current browser session; navigates to `/secret` via `router.push('/secret')` after 5 clicks within 1000ms.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/components/CoffeeBeanTrigger.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import CoffeeBeanTrigger from '@/components/game/CoffeeBeanTrigger';

const pushMock = jest.fn();
let mockPathname = '/';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: pushMock }),
}));

const STORAGE_KEY = 'coffee-bean-target';

describe('CoffeeBeanTrigger', () => {
  beforeEach(() => {
    sessionStorage.clear();
    pushMock.mockClear();
    mockPathname = '/';
  });

  it('renders nothing when the current page is not the session target', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ path: '/iot', xPercent: 50, yPercent: 50 }));
    mockPathname = '/';
    render(<CoffeeBeanTrigger />);
    expect(screen.queryByLabelText('coffee-bean')).not.toBeInTheDocument();
  });

  it('renders the bean when the current page matches the stored session target', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ path: '/iot', xPercent: 30, yPercent: 40 }));
    mockPathname = '/iot';
    render(<CoffeeBeanTrigger />);
    expect(screen.getByLabelText('coffee-bean')).toBeInTheDocument();
  });

  it('creates and persists a new random target when none exists in session storage', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
    mockPathname = '/';
    render(<CoffeeBeanTrigger />);
    expect(screen.getByLabelText('coffee-bean')).toBeInTheDocument();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify({ path: '/', xPercent: 5, yPercent: 10 })
    );
    randomSpy.mockRestore();
  });

  it('navigates to /secret after 5 rapid clicks', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ path: '/iot', xPercent: 30, yPercent: 40 }));
    mockPathname = '/iot';
    render(<CoffeeBeanTrigger />);
    const bean = screen.getByLabelText('coffee-bean');
    for (let i = 0; i < 5; i++) {
      fireEvent.click(bean);
    }
    expect(pushMock).toHaveBeenCalledWith('/secret');
  });

  it('does not navigate after fewer than 5 clicks', () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ path: '/iot', xPercent: 30, yPercent: 40 }));
    mockPathname = '/iot';
    render(<CoffeeBeanTrigger />);
    const bean = screen.getByLabelText('coffee-bean');
    fireEvent.click(bean);
    fireEvent.click(bean);
    expect(pushMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/__tests__/components/CoffeeBeanTrigger.test.tsx -v`
Expected: FAIL — `Cannot find module '@/components/game/CoffeeBeanTrigger'`.

- [ ] **Step 3: Implement `CoffeeBeanTrigger`**

Create `src/components/game/CoffeeBeanTrigger.tsx`:

```tsx
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

  useEffect(() => {
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/__tests__/components/CoffeeBeanTrigger.test.tsx -v`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/game/CoffeeBeanTrigger.tsx src/__tests__/components/CoffeeBeanTrigger.test.tsx
git commit -m "feat(game): add hidden coffee-bean click trigger"
```

---

### Task 6: Wire the trigger and bypass chrome on `/secret`

**Files:**
- Modify: `src/app/ClientShell.tsx`
- Test: `src/__tests__/components/ClientShell.test.tsx`

**Interfaces:**
- Consumes: `CoffeeBeanTrigger` (Task 5), `SecretPage` route `/secret` (Task 4).
- Produces: `ClientShell` renders bare `children` (no `Sidebar`/`Topbar`) when `pathname === '/secret'`; renders `<CoffeeBeanTrigger />` alongside the normal shell otherwise.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/ClientShell.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import ClientShell from '@/app/ClientShell';

let mockPathname = '/';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

describe('ClientShell', () => {
  beforeEach(() => {
    mockPathname = '/';
  });

  it('renders the sidebar chrome on normal routes', () => {
    render(
      <ClientShell>
        <div>page content</div>
      </ClientShell>
    );
    expect(screen.getByText('FutureKawa')).toBeInTheDocument();
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('bypasses the sidebar chrome on /secret', () => {
    mockPathname = '/secret';
    render(
      <ClientShell>
        <div>game content</div>
      </ClientShell>
    );
    expect(screen.queryByText('FutureKawa')).not.toBeInTheDocument();
    expect(screen.getByText('game content')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/__tests__/components/ClientShell.test.tsx -v`
Expected: FAIL on the second test — `/secret` currently still renders the `FutureKawa` sidebar (falls through to the `not-found` branch of `pageIdFromPath`, chrome included).

- [ ] **Step 3: Update `ClientShell.tsx`**

Modify `src/app/ClientShell.tsx`. Add the import and the early-return branch inside `InnerClientShell`:

```tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import CoffeeBeanTrigger from '@/components/game/CoffeeBeanTrigger';
import { PAGE_META } from '@/types';
import type { PageId } from '@/types';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { SearchProvider } from '@/contexts/SearchContext';

function pageIdFromPath(pathname: string): string {
  if (pathname === '/') return 'dashboard';
  const seg = pathname.split('/').filter(Boolean)[0];
  if (seg && seg in PAGE_META) return seg;
  return 'not-found';
}

function InnerClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/secret') {
    return <>{children}</>;
  }

  const pageId = pageIdFromPath(pathname);
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = pageId === 'not-found' ? t('page_not_found') : t(pageId);
  const subtitle = pageId === 'not-found' ? t('error_404') : t(`${pageId}_subtitle`);

  return (
    <div className="flex min-h-screen" style={{ background: '#EFE7DA' }}>
      <CoffeeBeanTrigger />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar 
          title={title} 
          subtitle={subtitle} 
          onMenuClick={() => setSidebarOpen(true)} 
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-[30px_32px_48px]">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <SearchProvider>
        <InnerClientShell>{children}</InnerClientShell>
      </SearchProvider>
    </LanguageProvider>
  );
}
```

Note: the `/secret` early return happens before the `useLanguage()`/`useState()` calls in the normal branch — this is safe because it is a **different pathname on a full route change**, not a conditional render within the same mounted tree; React remounts `InnerClientShell` fresh when Next.js navigates to a different route, so hook order is not violated across navigations of the same mounted component instance. Confirm this holds by running the full suite in Step 4.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/__tests__/components/ClientShell.test.tsx -v`
Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add src/app/ClientShell.tsx src/__tests__/components/ClientShell.test.tsx
git commit -m "feat(game): mount the coffee-bean trigger and bypass chrome on /secret"
```

---

### Task 7: Full verification pass

**Files:** None modified — verification only.

- [ ] **Step 1: Run the full new test suite**

Run:
```bash
npx jest src/__tests__/components/DinoRunner.test.tsx src/__tests__/components/CoffeeBeanTrigger.test.tsx src/__tests__/components/ClientShell.test.tsx src/__tests__/pages/Secret.test.tsx -v
```
Expected: all tests across the 4 files PASS.

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors in the new/modified files (`jest.config.ts`, `src/translations/index.ts`, `src/components/game/DinoRunner.tsx`, `src/components/game/CoffeeBeanTrigger.tsx`, `src/app/secret/page.tsx`, `src/app/ClientShell.tsx`). Pre-existing errors elsewhere in the repo, if any, are out of scope.

- [ ] **Step 3: Manual smoke test in the browser**

Run: `npm run dev`, then:
1. Open the app, refresh a few times until the coffee bean (small dark bean icon) appears somewhere on one of the pages.
2. Click it 5 times quickly — confirm it navigates to a chrome-free page with the dino game.
3. Click/tap the game area to start, press Space to jump over an obstacle, and let it collide — confirm "Partie terminée" and a best score appear.
4. Reload and replay — confirm the best score persists and the coffee bean now targets a (possibly) different page/position for the new session.

- [ ] **Step 4: Update the GitHub issue checklist**

Run: `gh issue view 28` to confirm the acceptance criteria, then check off the completed items:
```bash
gh issue comment 28 --body "Implémenté : easter egg grain de café (position + page aléatoires par session, 5 clics) redirigeant vers /secret, mini-jeu dino-runner avec meilleur score persisté en localStorage, textes traduits FR/EN/ES."
```
