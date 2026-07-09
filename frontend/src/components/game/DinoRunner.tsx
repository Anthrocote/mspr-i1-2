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
        className="absolute bottom-4 transition-transform"
        style={{
          left: DINO_X,
          width: DINO_SIZE,
          height: DINO_SIZE,
          transform: isJumping ? 'translateY(-50px)' : 'translateY(0)',
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 28 28" fill="none">
          <ellipse cx="14" cy="14" rx="12" ry="13.5" fill="var(--color-espresso-700)" />
          <path d="M14 2C10 9 10 19 14 26" stroke="var(--color-parchment-200)" strokeWidth="2" fill="none" />
        </svg>
      </div>
      {obstacles.map((o) => (
        <div
          key={o.id}
          data-testid="obstacle"
          className="absolute bottom-4"
          style={{ left: o.x, width: OBSTACLE_WIDTH, height: OBSTACLE_HEIGHT }}
        >
          <svg width="100%" height="100%" viewBox="0 0 18 30" fill="none">
            <path
              d="M6 4c0-2 2-2 2-4M12 4c0-2-2-2-2-4"
              stroke="var(--color-espresso-700)"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M2 10h11v9a5.5 5.5 0 01-5.5 5.5A5.5 5.5 0 012 19.5V10z"
              fill="var(--color-espresso-900)"
            />
            <path
              d="M13 12.5c2.5 0 4 1.5 4 3.5s-1.5 3.5-4 3.5"
              stroke="var(--color-espresso-900)"
              strokeWidth="1.5"
              fill="none"
            />
            <ellipse cx="7.5" cy="27" rx="7" ry="1.8" fill="var(--color-espresso-900)" opacity="0.5" />
          </svg>
        </div>
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
