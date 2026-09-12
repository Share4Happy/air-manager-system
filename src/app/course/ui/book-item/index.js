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
            className="flex flex-row bg-white rounded-xl border border-gray-100 shadow-[var(--boxshaw2)] overflow-hidden transition-all duration-300 w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.33%-11px)] xl:w-[calc(25%-12px)] cursor-pointer min-h-[160px] sm:min-h-[175px] md:min-h-[185px] hover:-translate-y-1 hover:shadow-[var(--boxshaw)]"
        >
            <div className="w-28 sm:w-36 md:w-40 shrink-0 relative bg-gradient-to-br from-[var(--main_l)] to-[var(--main_d)] overflow-hidden">
                <Image
                    src={url}
                    fill
                    sizes="(max-width: 640px) 120px, (max-width: 1024px) 160px, 200px"
                    className="object-cover"
                    alt={program.Name}
                />
            </div>
            <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                <div className="flex justify-between items-start gap-1.5 mb-1.5">
                    <p className="text-sm sm:text-base font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug" title={program.Name}>
                        {program.Name}
                    </p>
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold text-white bg-blue-600">
                        {program.Type || 'AI Robotic'}
                    </span>
                </div>
                <div className="flex flex-col gap-1 text-xs text-[var(--text-primary)] mt-auto pt-2">
                    <p className="truncate">
                        <span className="text-[var(--text-secondary)]">Mã: </span>
                        <span className="font-semibold text-gray-800">{program.ID}</span>
                    </p>
                    <p className="truncate">
                        <span className="text-[var(--text-secondary)]">Chủ đề: </span>
                        <span className="font-medium">{topicCount}</span>
                        <span className="text-[var(--text-secondary)] mx-1">•</span>
                        <span className="text-[var(--text-secondary)]">Số tiết: </span>
                        <span className="font-medium">{totalPeriods}</span>
                    </p>
                    <p className="truncate">
                        <span className="text-[var(--text-secondary)]">Học phí: </span>
                        <span className="font-bold text-blue-600 text-xs sm:text-sm">{formatPrice(program.Price)}</span>
                    </p>
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