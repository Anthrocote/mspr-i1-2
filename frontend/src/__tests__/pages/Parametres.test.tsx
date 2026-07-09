import { render, screen, fireEvent } from '@testing-library/react';
import ParametresPage from '@/app/parametres/page';
import { LanguageProvider } from '@/contexts/LanguageContext';

describe('ParametresPage', () => {
  it('renders IoT thresholds section', () => {
    render(<LanguageProvider><ParametresPage /></LanguageProvider>);
    expect(screen.getByText('Seuils IoT par pays')).toBeInTheDocument();
  });

  it('shows thresholds for all 3 countries', () => {
    render(<LanguageProvider><ParametresPage /></LanguageProvider>);
    expect(screen.getByText(/🇧🇷 Brésil/)).toBeInTheDocument();
    expect(screen.getByText(/🇪🇨 Équateur/)).toBeInTheDocument();
    expect(screen.getByText(/🇨🇴 Colombie/)).toBeInTheDocument();
  });

  it('shows temperature thresholds', () => {
    render(<LanguageProvider><ParametresPage /></LanguageProvider>);
    expect(screen.getByText('29°C ±3')).toBeInTheDocument();
    expect(screen.getByText('31°C ±3')).toBeInTheDocument();
    expect(screen.getByText('26°C ±3')).toBeInTheDocument();
  });

  it('shows humidity thresholds', () => {
    render(<LanguageProvider><ParametresPage /></LanguageProvider>);
    expect(screen.getByText('55% ±2')).toBeInTheDocument();
    expect(screen.getByText('60% ±3')).toBeInTheDocument();
    expect(screen.getByText('80% ±3')).toBeInTheDocument();
  });

  it('renders notifications section', () => {
    render(<LanguageProvider><ParametresPage /></LanguageProvider>);
    expect(screen.getByText('Notifications & règles')).toBeInTheDocument();
  });

  it('shows 3 toggle rows', () => {
    render(<LanguageProvider><ParametresPage /></LanguageProvider>);
    expect(screen.getByText('Alertes email')).toBeInTheDocument();
    expect(screen.getByText('Mode FIFO strict')).toBeInTheDocument();
    expect(screen.getByText('Surveillance IoT temps réel')).toBeInTheDocument();
  });

  it('shows toggle descriptions', () => {
    render(<LanguageProvider><ParametresPage /></LanguageProvider>);
    expect(screen.getByText(/Envoyer un email au responsable/)).toBeInTheDocument();
    expect(screen.getByText(/Bloquer toute sortie/)).toBeInTheDocument();
    expect(screen.getByText(/Rafraîchir les capteurs MQTT/)).toBeInTheDocument();
  });

  it('renders account section', () => {
    render(<LanguageProvider><ParametresPage /></LanguageProvider>);
    expect(screen.getByText('Compte')).toBeInTheDocument();
  });

  it('shows user info Marina Joaquim', () => {
    render(<LanguageProvider><ParametresPage /></LanguageProvider>);
    expect(screen.getByText('Marina Joaquim')).toBeInTheDocument();
    expect(screen.getByText(/marina.j@futurekawa.co/)).toBeInTheDocument();
  });

  it('renders save and cancel buttons', () => {
    render(<LanguageProvider><ParametresPage /></LanguageProvider>);
    expect(screen.getByText('Enregistrer')).toBeInTheDocument();
    expect(screen.getByText('Annuler')).toBeInTheDocument();
  });

  it('has editable name and language fields', () => {
    render(<LanguageProvider><ParametresPage /></LanguageProvider>);
    expect(screen.getByRole('textbox')).toHaveValue('Marina Joaquim');
    expect(screen.getByRole('combobox')).toHaveValue('fr');
  });

  it('renders 3 toggle buttons', () => {
    render(<LanguageProvider><ParametresPage /></LanguageProvider>);
    const allButtons = screen.getAllByRole('button');
    const toggleButtons = allButtons.filter((b) =>
      b.className.includes('w-[46px]')
    );
    expect(toggleButtons.length).toBe(3);
  });
});
