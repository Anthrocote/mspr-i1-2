import { render, screen, fireEvent } from '@testing-library/react';
import ClientShell from '@/app/ClientShell';

let mockPathname = '/';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn() }),
}));

describe('ClientShell', () => {
  beforeEach(() => {
    mockPathname = '/';
    localStorage.clear();
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

  it('treats an Object.prototype segment as not-found, not a real page', () => {
    // Before the fix `'constructor' in PAGE_META` was true and t('constructor')
    // returned the Object constructor, crashing the <h1>.
    mockPathname = '/constructor';
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <ClientShell>
          <div>page content</div>
        </ClientShell>
      )
    ).not.toThrow();
    expect(screen.getByText('Page non trouvée')).toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('opens the contextual help drawer for the current page', () => {
    mockPathname = '/lots';
    render(
      <ClientShell>
        <div>page content</div>
      </ClientShell>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir l\'aide de cette page' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Gérer les lots')).toBeInTheDocument();
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
