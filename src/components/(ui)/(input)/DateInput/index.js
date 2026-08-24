'use client';
import React, { useState, useEffect, useRef, useId } from 'react';

function parseDateValue(raw) {
    if (!raw) return { display: '', iso: '' };
    if (raw instanceof Date && !isNaN(raw)) {
        const y = raw.getFullYear();
        const m = String(raw.getMonth() + 1).padStart(2, '0');
        const d = String(raw.getDate()).padStart(2, '0');
        return { display: `${d}/${m}/${y}`, iso: `${y}-${m}-${d}` };
    }
    const str = String(raw).trim();
    if (!str) return { display: '', iso: '' };

    // Format DD/MM/YYYY
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
            const d = parts[0].padStart(2, '0');
            const m = parts[1].padStart(2, '0');
            const y = parts[2];
            if (y.length === 4) {
                return { display: `${d}/${m}/${y}`, iso: `${y}-${m}-${d}` };
            }
        }
        return { display: str, iso: '' };
    }

    // Format YYYY-MM-DD or ISO string
    if (str.includes('-')) {
        const datePart = str.split('T')[0];
        const parts = datePart.split('-');
        if (parts.length === 3) {
            const y = parts[0];
            const m = parts[1].padStart(2, '0');
            const d = parts[2].padStart(2, '0');
            if (y.length === 4) {
                return { display: `${d}/${m}/${y}`, iso: `${y}-${m}-${d}` };
            }
        }
        return { display: str, iso: '' };
    }

    return { display: str, iso: '' };
}

const DateInput = ({
    value,
    onChange,
    name,
    className = '',
    placeholder = 'DD/MM/YYYY',
    disabled,
    style,
    wrapperClassName = '',
    ...rest
}) => {
    const initial = parseDateValue(value);
    const [display, setDisplay] = useState(initial.display);
    const focused = useRef(false);
    const hiddenDateRef = useRef(null);

    useEffect(() => {
        if (!focused.current) {
            const parsed = parseDateValue(value);
            setDisplay(parsed.display);
        }
    }, [value]);

    const handleTextChange = (e) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
        if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5);
        if (val.length > 10) val = val.slice(0, 10);
        setDisplay(val);
        const parts = val.split('/');
        if (parts.length === 3 && parts[2]?.length === 4) {
            const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            onChange?.(iso);
        } else if (val === '') {
            onChange?.('');
        }
    };

    const handleDateChange = (e) => {
        const iso = e.target.value;
        const parsed = parseDateValue(iso);
        setDisplay(parsed.display);
        onChange?.(parsed.iso);
    };

    const handleOpenPicker = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        if (hiddenDateRef.current) {
            try {
                if (typeof hiddenDateRef.current.showPicker === 'function') {
                    hiddenDateRef.current.showPicker();
                    return;
                }
            } catch (err) {
                // Ignore if already open or not supported
            }
            try {
                hiddenDateRef.current.focus();
                hiddenDateRef.current.click();
            } catch {}
        }
    };

    const parsed = parseDateValue(value);
    const isoValue = parsed.iso;
    const isFullWidth = className.includes('w-full') || className.includes('w-[calc(100%');
    const isFlex1 = className.includes('flex-1');

    return (
        <div
            className={`relative inline-flex items-center ${isFullWidth ? 'w-full' : ''} ${isFlex1 ? 'flex-1' : ''} ${wrapperClassName}`}
            style={{ width: style?.width, flex: style?.flex, ...style }}
        >
            {name && <input type="hidden" name={name} value={value || ''} />}
            <input
                type="text"
                inputMode="numeric"
                placeholder={placeholder}
                value={display}
                onChange={handleTextChange}
                onFocus={() => { focused.current = true; }}
                onBlur={() => { focused.current = false; }}
                className={`pr-8 ${className}`}
                disabled={disabled}
                {...rest}
            />
            {/* Hidden native date input placed under icon */}
            <input
                ref={hiddenDateRef}
                type="date"
                value={isoValue}
                onChange={handleDateChange}
                disabled={disabled}
                tabIndex={-1}
                aria-hidden="true"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 pointer-events-none z-0"
            />
            {/* Interactive calendar button */}
            <button
                type="button"
                tabIndex={-1}
                onClick={handleOpenPicker}
                disabled={disabled}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 p-0 border-none bg-transparent text-gray-400 hover:text-[var(--main_d,#2563eb)] disabled:opacity-30 transition-colors cursor-pointer z-10"
                title="Chọn ngày"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={14} height={14} fill="currentColor">
                    <path d="M152 24c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40L64 64C28.7 64 0 92.7 0 128l0 16 0 48L0 448c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-256 0-48 0-16c0-35.3-28.7-64-64-64l-40 0 0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40L152 64l0-40zM384 192l0 256c0 17.7-14.3 32-32 32L96 480c-17.7 0-32-14.3-32-32l0-256 320 0z"/>
                </svg>
            </button>
        </div>
    );
};

export default DateInput;
