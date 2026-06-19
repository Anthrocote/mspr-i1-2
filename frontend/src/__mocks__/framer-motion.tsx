import React from 'react';

const motion = new Proxy({} as Record<string, React.FC<Record<string, unknown>>>, {
  get: (_target, prop: string) => {
    return React.forwardRef(function MotionComponent(
      { children, ...props }: Record<string, unknown> & { children?: React.ReactNode },
      ref: React.Ref<unknown>
    ) {
      const filteredProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        if (
          !key.startsWith('while') &&
          !key.startsWith('animate') &&
          !key.startsWith('initial') &&
          !key.startsWith('exit') &&
          !key.startsWith('transition') &&
          !key.startsWith('variants') &&
          !key.startsWith('layout') &&
          !key.startsWith('drag') &&
          key !== 'whileHover' &&
          key !== 'whileTap' &&
          key !== 'whileFocus' &&
          key !== 'whileInView'
        ) {
          filteredProps[key] = value;
        }
      }
      return React.createElement(prop, { ...filteredProps, ref }, children);
    });
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

function useInView() {
  return [null, true];
}

export { motion, AnimatePresence, useAnimation, useInView };
