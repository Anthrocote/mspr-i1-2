'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

// No count badges here: the honest source for a lots/alerts total is the siège
// API, and the sidebar deliberately does not fetch (it is pure navigation
// chrome). Each page owns and displays its own counts.
const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
  )},
  { id: 'lots', label: 'Gestion des Lots', href: '/lots', icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
  )},
  { id: 'iot', label: 'Surveillance IoT', href: '/iot', icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
  )},
  { id: 'alertes', label: 'Alertes', href: '/alertes', icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  )},
  { id: 'exploitations', label: 'Exploitations', href: '/exploitations', icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/></svg>
  )},
  { id: 'aide', label: 'Aide', href: '/aide', icon: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  )},
];

function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useLanguage();

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const sidebarContent = (isDesktop: boolean) => {
    const collapsed = isDesktop && isCollapsed;

    return (
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`h-full bg-espresso-800 flex flex-col py-6 relative overflow-y-auto transition-all duration-300 ${
          collapsed ? 'w-[76px] px-3' : 'w-[248px] px-[18px]'
        }`}
        style={{ boxShadow: '0 8px 32px rgba(44,26,10,.18)' }}
      >
        {/* Close button on mobile */}
        {!isDesktop && (
          <div className="flex justify-end lg:hidden mb-2">
            <button
              onClick={onClose}
              className="p-1 rounded-md text-espresso-300 hover:text-parchment-100 hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Fermer le menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        {/* Logo */}
        <div className={`flex items-center gap-3 mb-[34px] px-1.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-[38px] h-[38px] bg-white/10 border border-white/[.08] rounded-[9px] flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M17 8C8 10 5.9 16.17 3.82 20.54L5.71 21.39C6 20.84 6.26 20.29 6.57 19.76C8.58 20.56 10.81 20.47 12.75 19.49C15.12 18.3 16.59 15.86 16.99 13.17L17.5 13C18.5 12.5 20 12 20 12C20 12 21 12 21 11C21 10 20 10 20 10L17 8Z" fill="#C49A78"/>
              <path d="M2 12C2 12 3 9 6 9C9 9 9 12 12 12C15 12 15 9 18 9" stroke="#E8D9C4" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <div className="font-display text-[21px] font-semibold text-parchment-100 tracking-[.02em] leading-none">FutureKawa</div>
              <div className="text-[10px] text-espresso-400 tracking-[.14em] uppercase mt-[3px]">Suivi des stocks</div>
            </motion.div>
          )}
        </div>

        {/* Menu */}
        <div className={`text-[11px] font-semibold text-espresso-400 uppercase tracking-[.13em] mb-2 ${
          collapsed ? 'text-center text-[9px] opacity-60 ml-0' : 'ml-3'
        }`}>
          {collapsed ? '•' : t('menu')}
        </div>
        <nav className="flex flex-col gap-[3px] mb-[22px]">
          {MENU_ITEMS.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <motion.div key={item.id} whileHover={{ scale: 1.01 }} transition={{ duration: 0.12 }}>
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  title={collapsed ? t(item.id) : undefined}
                  className={`relative flex items-center rounded-xl text-sm font-medium transition-all duration-150 ${
                    collapsed ? 'justify-center py-[10px] px-0' : 'py-[10px] px-[13px] gap-3'
                  } ${
                    active
                      ? 'bg-white/10 text-parchment-100 border border-white/[.08]'
                      : 'text-espresso-300 border border-transparent hover:bg-white/[.07] hover:text-parchment-100'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-indicator"
                      className="absolute -left-[18px] top-[9px] bottom-[9px] w-[3px] bg-parchment-400 rounded-r-[3px]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  {item.icon}
                  {!collapsed && t(item.id)}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Collapse toggle button on desktop */}
        {isDesktop && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center justify-center py-2.5 mt-auto text-espresso-300 hover:text-parchment-100 hover:bg-white/10 rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/[.08] ${
              collapsed ? 'w-full px-0' : 'w-full px-3 gap-3 justify-start'
            }`}
            title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
          >
            {collapsed ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span className="text-sm font-medium">Réduire le menu</span>
              </>
            )}
          </button>
        )}
      </motion.aside>
    );
  };

  return (
    <>
      {/* Desktop Sidebar - hidden on screens under lg */}
      <div className={`hidden lg:block shrink-0 sticky top-0 h-screen transition-all duration-300 ${
        isCollapsed ? 'w-[76px]' : 'w-[248px]'
      }`}>
        {sidebarContent(true)}
      </div>

      {/* Mobile/Tablet Sidebar Drawer - uses overlay & slide-in animations */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Dark overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />
            {/* Drawer sheet sliding from left */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative z-10 h-full"
            >
              {sidebarContent(false)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
