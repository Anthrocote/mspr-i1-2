import { render, screen } from '@testing-library/react';
import ClientShell from '@/app/ClientShell';

let mockPathname = '/';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn() }),
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

  // Next.js's App Router hosts ClientShell inside the single root layout, so a
  // client-side navigation (e.g. the coffee-bean trigger's router.push('/secret'))
  // re-renders the SAME InnerClientShell instance with a new pathname — it does
  // NOT unmount/remount it. Any hook called conditionally on pathname (e.g. an
  // early return before useState) would violate the Rules of Hooks across this
  // same-instance transition. Exercise that with rerender (not a fresh render)
  // to catch a real regression, rather than trusting that it "must" remount.
  it('does not violate the rules of hooks when the same mounted instance navigates to and from /secret', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockPathname = '/';
    const { rerender } = render(
      <ClientShell>
        <div>page content</div>
      </ClientShell>
    );
    expect(screen.getByText('FutureKawa')).toBeInTheDocument();

    mockPathname = '/secret';
    expect(() =>
      rerender(
        <ClientShell>
          <div>game content</div>
        </ClientShell>
      )
    ).not.toThrow();
    expect(screen.getByText('game content')).toBeInTheDocument();

    mockPathname = '/';
    expect(() =>
      rerender(
        <ClientShell>
          <div>page content again</div>
        </ClientShell>
      )
    ).not.toThrow();
    expect(screen.getByText('FutureKawa')).toBeInTheDocument();

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
