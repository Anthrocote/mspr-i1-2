'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 200;
const GROUND_Y = CANVAS_HEIGHT - 24;
const DINO_X = 40;
const DINO_RADIUS = 14;
const OBSTACLE_WIDTH = 18;
const OBSTACLE_HEIGHT = 30;
const BASE_SPEED = 160; // px/sec
const SPEED_PER_100_SCORE = 40; // px/sec added per 100 points
const JUMP_VELOCITY = -420; // px/sec
const GRAVITY = 1400; // px/sec^2
const MIN_SPAWN_MS = 800;
const MAX_SPAWN_MS = 1600;
const SCORE_PER_SECOND = 10;
const MAX_DELTA_SECONDS = 0.05;
const BEST_SCORE_KEY = 'dino-best-score';

const COLOR_BG = '#FFFCF8'; // parchment-0
const COLOR_GROUND = '#E8D9C4'; // parchment-400
const COLOR_BEAN = '#3D2610'; // espresso-700
const COLOR_BEAN_LINE = '#DFC0A0'; // parchment-200
const COLOR_CUP = '#1E0F06'; // espresso-900

interface Obstacle {
  id: number;
  x: number;
}

type Phase = 'ready' | 'playing' | 'gameover';

function randomSpawnMs(): number {
  return MIN_SPAWN_MS + Math.random() * (MAX_SPAWN_MS - MIN_SPAWN_MS);
}

function readBestScore(): number {
  const raw = localStorage.getItem(BEST_SCORE_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

export default function DinoRunner() {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  // Simulation state lives in refs, not React state: it's mutated every
  // animation frame, and re-rendering on every frame would defeat the
  // point of moving to canvas. Only score/phase go through React state,
  // since those drive the HUD text and are updated far less often.
  const dinoY = useRef(0); // 0 = grounded, negative = above ground
  const dinoVelocity = useRef(0);
  const obstacles = useRef<Obstacle[]>([]);
  const nextObstacleId = useRef(0);
  const spawnTimerMs = useRef(randomSpawnMs());
  const scoreAccumulator = useRef(0);
  const scoreRef = useRef(0);
  const rafId = useRef<number | null>(null);
  const lastTime = useRef<number | null>(null);

  useEffect(() => {
    setBestScore(readBestScore());
  }, []);

  function draw() {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = COLOR_GROUND;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 4);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 4);
    ctx.stroke();

    // dino, drawn as a coffee bean
    const beanCenterY = GROUND_Y - DINO_RADIUS + dinoY.current;
    ctx.fillStyle = COLOR_BEAN;
    ctx.beginPath();
    ctx.ellipse(DINO_X + DINO_RADIUS, beanCenterY, DINO_RADIUS, DINO_RADIUS * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLOR_BEAN_LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(DINO_X + DINO_RADIUS, beanCenterY - DINO_RADIUS * 1.15);
    ctx.quadraticCurveTo(
      DINO_X + DINO_RADIUS - 5,
      beanCenterY,
      DINO_X + DINO_RADIUS,
      beanCenterY + DINO_RADIUS * 1.15
    );
    ctx.stroke();

    // obstacles, drawn as coffee cups
    for (const o of obstacles.current) {
      const top = GROUND_Y - OBSTACLE_HEIGHT;
      ctx.fillStyle = COLOR_CUP;
      ctx.beginPath();
      ctx.moveTo(o.x, top + 6);
      ctx.lineTo(o.x + OBSTACLE_WIDTH, top + 6);
      ctx.lineTo(o.x + OBSTACLE_WIDTH - 2, top + OBSTACLE_HEIGHT);
      ctx.quadraticCurveTo(
        o.x + OBSTACLE_WIDTH / 2,
        top + OBSTACLE_HEIGHT + 4,
        o.x + 2,
        top + OBSTACLE_HEIGHT
      );
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = COLOR_CUP;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(o.x + OBSTACLE_WIDTH + 2, top + 14, 5, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }
  }

  function isJumpingNow(): boolean {
    return dinoY.current < -1;
  }

  function checkCollision(): boolean {
    return obstacles.current.some(
      (o) => !isJumpingNow() && o.x < DINO_X + DINO_RADIUS * 2 && o.x + OBSTACLE_WIDTH > DINO_X
    );
  }

  /** Advances the simulation by dtSeconds. Returns false once the game is over. */
  function step(dtSeconds: number): boolean {
    const speed = BASE_SPEED + Math.floor(scoreRef.current / 100) * SPEED_PER_100_SCORE;

    dinoVelocity.current += GRAVITY * dtSeconds;
    dinoY.current += dinoVelocity.current * dtSeconds;
    if (dinoY.current > 0) {
      dinoY.current = 0;
      dinoVelocity.current = 0;
    }

    obstacles.current = obstacles.current
      .map((o) => ({ ...o, x: o.x - speed * dtSeconds }))
      .filter((o) => o.x + OBSTACLE_WIDTH > 0);

    spawnTimerMs.current -= dtSeconds * 1000;
    if (spawnTimerMs.current <= 0) {
      obstacles.current = [...obstacles.current, { id: nextObstacleId.current++, x: CANVAS_WIDTH }];
      spawnTimerMs.current = randomSpawnMs();
    }

    scoreAccumulator.current += dtSeconds * SCORE_PER_SECOND;
    const newScore = Math.floor(scoreAccumulator.current);
    if (newScore !== scoreRef.current) {
      scoreRef.current = newScore;
      setScore(newScore);
    }

    if (checkCollision()) {
      setPhase('gameover');
      return false;
    }
    return true;
  }

  useEffect(() => {
    if (phase !== 'playing') {
      draw();
      return;
    }

    lastTime.current = null;

    function frame(time: number) {
      if (lastTime.current == null) lastTime.current = time;
      const dt = Math.min((time - lastTime.current) / 1000, MAX_DELTA_SECONDS);
      lastTime.current = time;

      const stillPlaying = step(dt);
      draw();

      if (stillPlaying) {
        rafId.current = requestAnimationFrame(frame);
      }
    }

    rafId.current = requestAnimationFrame(frame);
    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

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

  function startGame() {
    scoreAccumulator.current = 0;
    scoreRef.current = 0;
    setScore(0);
    obstacles.current = [];
    nextObstacleId.current = 0;
    spawnTimerMs.current = randomSpawnMs();
    dinoY.current = 0;
    dinoVelocity.current = 0;
    setPhase('playing');
  }

  function jump() {
    if (dinoY.current === 0) {
      dinoVelocity.current = JUMP_VELOCITY;
    }
  }

  function handleAction() {
    if (phase === 'playing') {
      jump();
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
      className="relative mx-auto rounded-lg overflow-hidden select-none cursor-pointer border border-parchment-400"
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, maxWidth: '100%' }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
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
