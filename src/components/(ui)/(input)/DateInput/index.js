import React, { useState, useEffect, useRef } from 'react';

const toDisplay = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
};

const DateInput = ({ value, onChange, name, className, placeholder = 'DD/MM/YYYY', disabled, ...rest }) => {
    const [display, setDisplay] = useState(() => toDisplay(value));
    const focused = useRef(false);

    useEffect(() => {
        if (!focused.current) setDisplay(toDisplay(value));
    }, [value]);

    const handleChange = (e) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
        if (val.length > 5) val = val.slice(0, 5) + '/' + val.slice(5);
        if (val.length > 10) val = val.slice(0, 10);
        setDisplay(val);
        const parts = val.split('/');
        const iso = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
        onChange(iso);
    };

    return (
        <>
            {name && <input type="hidden" name={name} value={value || ''} />}
            <input
                type="text"
                inputMode="numeric"
                placeholder={placeholder}
                value={display}
                onChange={handleChange}
                onFocus={() => { focused.current = true; }}
                onBlur={() => { focused.current = false; }}
                className={className}
                disabled={disabled}
                {...rest}
            />
        </>
    );
};

export default DateInput;
