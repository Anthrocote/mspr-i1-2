import React from 'react';

const MOTION_PROP_PREFIXES = ['while', 'animate', 'initial', 'exit', 'transition', 'variants', 'layout', 'drag'];

function isMotionProp(key: string): boolean {
  return MOTION_PROP_PREFIXES.some((p) => key.startsWith(p));
}

// One stable component per tag, cached: returning a fresh forwardRef on every
// proxy access would change the element type each render and remount the
// subtree, a semantics the real library does not have.
const cache = new Map<string, React.FC<Record<string, unknown>>>();

const motion = new Proxy({} as Record<string, React.FC<Record<string, unknown>>>, {
  get: (_target, prop: string) => {
    const cached = cache.get(prop);
    if (cached) return cached;
    const Component = React.forwardRef(function MotionComponent(
      { children, ...props }: Record<string, unknown> & { children?: React.ReactNode },
      ref: React.Ref<unknown>
    ) {
      const filteredProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        if (!isMotionProp(key)) filteredProps[key] = value;
      }
      return React.createElement(prop, { ...filteredProps, ref }, children);
    }) as unknown as React.FC<Record<string, unknown>>;
    cache.set(prop, Component);
    return Component;
  },
});

function AnimatePresence({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function useAnimation() {
  return {
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  };
}

// The real hook returns a boolean.
function useInView() {
  return true;
}

export { motion, AnimatePresence, useAnimation, useInView };
