'use client';

import { SEND_VARIABLES } from './constants';

export default function VariableChips({ onInsert }) {
    return (
        <div className="flex flex-wrap gap-1.5 mt-1">
            {SEND_VARIABLES.map(v => (
                <button
                    key={v.key}
                    type="button"
                    onClick={() => onInsert(`{${v.key}}`)}
                    title={v.label}
                    className="px-2 py-0.5 rounded bg-gray-100 border border-gray-300 text-xs font-mono text-[var(--main_d)] cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-colors"
                >
                    {`{${v.key}}`}
                </button>
            ))}
        </div>
    );
}
