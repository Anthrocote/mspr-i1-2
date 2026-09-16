import { notFound } from 'next/navigation';
import { HELP_SLUGS, type HelpSlug } from '@/content/help';
import AideArticleView from './AideArticleView';

// Next 16: params is a Promise in dynamic routes and must be awaited.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!HELP_SLUGS.includes(slug as HelpSlug)) notFound();
  return <AideArticleView slug={slug as HelpSlug} />;
}

export function generateStaticParams() {
  return HELP_SLUGS.map((slug) => ({ slug }));
}
