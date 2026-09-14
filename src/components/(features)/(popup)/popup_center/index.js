'use client';

export default function CenterPopup({
    open,
    onClose,
    title = '',
    children,
    size = 'md',
    globalZIndex = 1000
}) {
    if (!open) return null;

    const sizeClass = size === 'sm' ? 'max-w-[420px]' : size === 'lg' ? 'max-w-[95vw] lg:max-w-[1000px]' : 'max-w-[560px]';

    return (
        <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4" style={{ zIndex: globalZIndex }} onMouseDown={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
            <div
                className={`relative bg-[var(--bg-primary)] rounded-xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] w-full min-w-0 overflow-hidden ${sizeClass}`}
                onMouseDown={e => e.stopPropagation()}
            >
                {title && (
                    <div className="flex justify-between items-center px-4 py-3 border-b border-[var(--border-color)] min-w-0 bg-[var(--bg-primary)]">
                        <h3 className="m-0 text-base sm:text-lg font-semibold text-[var(--text-primary)] truncate flex-1 mr-2">{title}</h3>
                        <button className="bg-transparent border-none text-2xl cursor-pointer text-[var(--text-primary)] shrink-0 leading-none hover:opacity-70 transition-opacity" onClick={onClose}>&times;</button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full break-words">{children}</div>
            </div>
        </div>
    );
}
