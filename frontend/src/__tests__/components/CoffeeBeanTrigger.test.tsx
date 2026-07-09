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
