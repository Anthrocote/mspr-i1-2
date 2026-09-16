'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { HELP_ARTICLES, getArticle, type HelpSlug } from '@/content/help';
import ArticleRenderer from '@/components/help/ArticleRenderer';

export default function AideArticleView({ slug }: { slug: HelpSlug }) {
  const { language } = useLanguage();
  const article = getArticle(slug);
  if (!article) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <nav className="lg:w-56 shrink-0 flex flex-col gap-1">
        {HELP_ARTICLES.map((a) => (
          <Link
            key={a.slug}
            href={`/aide/${a.slug}`}
            className={`rounded-lg px-3 py-2 text-sm ${
              a.slug === slug
                ? 'bg-white text-espresso-900 font-semibold border border-parchment-400'
                : 'text-parchment-900 hover:bg-white/60'
            }`}
          >
            {a.title[language]}
          </Link>
        ))}
      </nav>
      <article className="flex-1 min-w-0 bg-white border border-parchment-400 rounded-xl p-6">
        <h1 className="font-display text-[25px] font-bold text-espresso-900 mb-4">
          {article.title[language]}
        </h1>
        <ArticleRenderer blocks={article.blocks[language]} />
      </article>
    </div>
  );
}
