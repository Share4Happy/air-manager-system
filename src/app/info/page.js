'use client';

import { useSearchParams, useRouter } from 'next/navigation';

const TABS = [
    { key: 'info', label: 'Thông tin', src: 'https://docs.google.com/document/d/138s-w91Sa2DtbatlEJpQH4k9eISLVJHP7qoLl218rrw/edit?tab=t.0' },
    { key: 'feedback', label: 'Feedback', src: 'https://docs.google.com/document/d/18ApttvJfGK_GZEvKzAAApqlaSSXRh9wQJf2GSPRYwSA/edit?usp=sharing' },
];

export default function InfoPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get('tab') || 'info';
    const current = TABS.find(t => t.key === activeTab) || TABS[0];

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex gap-1 px-3 py-2 border-b border-[var(--border-color)] overflow-x-auto shrink-0">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => router.push(`/info${tab.key === 'info' ? '' : '?tab=' + tab.key}`)}
                        className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors cursor-pointer
                            ${current.key === tab.key
                                ? 'bg-[var(--main_d)] text-white font-medium'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--hover)]'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <iframe
                key={current.key}
                src={current.src}
                className="w-full h-full border-none"
                title={current.label}
            />
        </div>
    );
}
