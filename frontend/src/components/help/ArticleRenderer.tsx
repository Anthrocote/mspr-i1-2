import Image from 'next/image';
import type { HelpBlock } from '@/content/help/types';

// Pure presentation: maps each block kind to markup. No data fetching, no state.
export default function ArticleRenderer({ blocks }: { blocks: HelpBlock[] }) {
  return (
    <div className="flex flex-col gap-4 text-espresso-900">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'heading':
            return <h2 key={i} className="font-display text-[19px] font-semibold mt-2">{block.text}</h2>;
          case 'paragraph':
            return <p key={i} className="text-sm leading-relaxed text-parchment-900">{block.text}</p>;
          case 'list':
            return (
              <ul key={i} className="list-disc pl-5 flex flex-col gap-1 text-sm">
                {block.items.map((it, j) => <li key={j}>{it}</li>)}
              </ul>
            );
          case 'steps':
            return (
              <ol key={i} className="list-decimal pl-5 flex flex-col gap-1 text-sm">
                {block.items.map((it, j) => <li key={j}>{it}</li>)}
              </ol>
            );
          case 'callout':
            return (
              <div
                key={i}
                className={`rounded-lg border px-4 py-3 text-sm ${
                  block.tone === 'warning'
                    ? 'bg-[#FEF3E2] border-[#F6CC7A] text-[#B45309]'
                    : 'bg-[#EFF6FF] border-[#93C5FD] text-[#1E4D8C]'
                }`}
              >
                {block.text}
              </div>
            );
          case 'image':
            return (
              <Image
                key={i}
                src={block.src}
                alt={block.alt}
                width={1200}
                height={720}
                className="rounded-lg border border-parchment-400 w-full h-auto"
              />
            );
          case 'qa':
            return (
              <div key={i} className="rounded-lg border border-parchment-300 bg-parchment-50 px-4 py-3.5">
                <p className="font-semibold text-espresso-900 mb-1.5">{block.q}</p>
                <p className="text-sm leading-relaxed text-parchment-700">{block.a}</p>
              </div>
            );
        }
      })}
    </div>
  );
}
