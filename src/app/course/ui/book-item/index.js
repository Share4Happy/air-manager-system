import Image from 'next/image';
import Link from 'next/link';
import { srcImage } from '@/function';

const formatPrice = (price) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
};

const ProgramCard = ({ program }) => {
    const topicCount = Object.keys(program.Topics || {}).length;
    const totalPeriods = program.Topics?.reduce((total, item) => total + (item.Period || 0), 0) || 0;
    const url = program.Image ? (program.Image.split('/').length == 5 ? program.Image : srcImage(program.Image)) : '/placeholder.png';

    return (
        <Link
            href={`/course/book/${program._id}`}
            className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-[var(--boxshaw2)] overflow-hidden transition-all duration-300 w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.33%-11px)] xl:w-[calc(25%-12px)] cursor-pointer hover:-translate-y-1.5 hover:shadow-[var(--boxshaw)]"
        >
            {/* Image Header with 16:10 aspect ratio */}
            <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0">
                <Image
                    src={url}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    alt={program.Name}
                />
                <div className="absolute top-2.5 right-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold text-white bg-blue-600/90 backdrop-blur-xs shadow-xs">
                        {program.Type || 'AI Robotic'}
                    </span>
                </div>
                {program.ID && (
                    <div className="absolute top-2.5 left-2.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-gray-700 bg-white/90 backdrop-blur-xs shadow-xs font-mono">
                            {program.ID}
                        </span>
                    </div>
                )}
            </div>

            {/* Card Content Body */}
            <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between min-w-0 gap-2.5">
                <div>
                    <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors" title={program.Name}>
                        {program.Name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-2">
                        <span><strong className="text-[var(--text-primary)] font-medium">{topicCount}</strong> chủ đề</span>
                        <span>•</span>
                        <span><strong className="text-[var(--text-primary)] font-medium">{totalPeriods}</strong> tiết</span>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-[var(--text-secondary)]">Học phí</span>
                        <span className="font-bold text-blue-600 text-xs sm:text-sm">{formatPrice(program.Price)}</span>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Chi tiết
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
};

const ProgramList = ({ programs }) => {
    if (!programs || programs.length === 0) {
        return (
            <div className="p-8 text-center bg-white rounded-lg border border-gray-200 text-gray-500 text-sm">
                Không tìm thấy chương trình nào phù hợp.
            </div>
        );
    }
    
    return (
        <div className="flex flex-wrap gap-2.5 sm:gap-4">
            {programs.map(program => (
                <ProgramCard key={program._id} program={program} />
            ))}
        </div>
    );
};

export default ProgramList;