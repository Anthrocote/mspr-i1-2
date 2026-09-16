'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { getArticle, type HelpSlug } from '@/content/help';
import ArticleRenderer from './ArticleRenderer';

interface HelpDrawerProps {
  slug: HelpSlug;
  open: boolean;
  onClose: () => void;
}

export default function HelpDrawer({ slug, open, onClose }: HelpDrawerProps) {
  const { t, language } = useLanguage();
  const article = getArticle(slug);

  return (
    <AnimatePresence>
      {open && article && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40"
          />
          <motion.aside
            role="dialog"
            aria-label={article.title[language]}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="relative z-10 h-full w-[90%] sm:w-[420px] bg-parchment-100 overflow-y-auto p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-espresso-900">{article.title[language]}</h2>
              <button onClick={onClose} aria-label={t('help_close')} className="p-1 text-espresso-900 cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <ArticleRenderer blocks={article.blocks[language]} />
            <Link href={`/aide/${slug}`} onClick={onClose} className="mt-6 inline-block text-sm font-semibold text-espresso-400 underline">
              {t('help_open_full')}
            </Link>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
