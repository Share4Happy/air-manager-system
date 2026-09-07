import { colorText_noti } from '@/data/style/color';

export default function TextNoti({ mes, title, color }) {
    color = colorText_noti({ key: color ? color : 'default' });

    return (
        <div className='p-3 bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-md break-words max-w-full min-w-0' style={{ borderColor: color.color, background: color.background }}>
            {title && <p className='text-sm sm:text-base font-semibold text-[var(--text-primary)] break-words mb-1' style={{ color: color.color }}>{title}</p>}
            <div className='text-xs sm:text-sm font-normal text-[var(--text-primary)] break-words whitespace-normal leading-relaxed min-w-0' style={{ color: color.color }}>{mes}</div>
        </div>
    )
}