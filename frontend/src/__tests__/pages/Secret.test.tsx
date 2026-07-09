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
