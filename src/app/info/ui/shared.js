export const ROLES = ['Admin', 'Academic', 'Teacher', 'Sale']

export const ROLE_META = {
    Admin: { label: 'Quản trị', color: '#dc3545', bg: '#fdecef' },
    Academic: { label: 'Học vụ', color: '#0374da', bg: '#e8f4ff' },
    Teacher: { label: 'Giáo viên', color: '#28a745', bg: '#eaf7ee' },
    Sale: { label: 'Chăm sóc', color: '#e67e22', bg: '#fdf2e6' },
}

export function roleMeta(role) {
    return ROLE_META[role] || { label: role, color: '#0374da', bg: '#e8f4ff' }
}

export function RoleBadge({ role, size = 'md' }) {
    const meta = roleMeta(role)
    const cls = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${cls}`}
            style={{ color: meta.color, backgroundColor: meta.bg }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
            {meta.label}
        </span>
    )
}

export function RoleTabs({ roles, active, onChange }) {
    return (
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--hover)]">
            {roles.map(r => {
                const meta = roleMeta(r)
                const isActive = active === r
                return (
                    <button key={r}
                        onClick={() => onChange(r)}
                        className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer border-none whitespace-nowrap
                            ${isActive ? 'text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        style={isActive ? { backgroundColor: meta.color } : {}}>
                        {meta.label}
                    </button>
                )
            })}
        </div>
    )
}
