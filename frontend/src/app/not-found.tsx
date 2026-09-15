'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-[600px] mx-auto text-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full bg-parchment-0 border border-parchment-400 rounded-lg p-8 sm:p-12 shadow-xs"
      >
        {/* Large stylized 404 */}
        <h1 className="text-8xl sm:text-9xl font-display font-bold text-espresso-700 tracking-tight leading-none mb-4 select-none">
          404
        </h1>
        
        {/* Subtitle */}
        <h2 className="text-2xl font-display font-semibold text-espresso-900 mb-4">
          {t('page_not_found')}
        </h2>
        
        {/* Description */}
        <p className="text-neutral-600 font-body text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
          {t('error_404_desc')}
        </p>

        {/* Back Button */}
        <div className="flex justify-center">
          <Link href="/" passHref legacyBehavior>
            <a className="inline-flex items-center gap-2 px-6 py-3 bg-espresso-700 hover:bg-espresso-800 text-parchment-50 font-body font-semibold rounded transition-colors text-sm shadow-xs cursor-pointer">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>{t('back_to_dashboard')}</span>
            </a>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
