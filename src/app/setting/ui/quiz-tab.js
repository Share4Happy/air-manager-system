'use client'

import { useState, useEffect, useCallback } from 'react'
import Noti from '@/components/(features)/(noti)/noti'
import { ROLES, RoleTabs } from '@/app/info/ui/shared'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function SectionCard({ icon, title, subtitle, children }) {
    return (
        <div className="rounded-2xl bg-white p-5"
            style={{ border: '1px solid var(--border-color)', boxShadow: 'var(--boxshaw)' }}>
            <div className="flex items-center gap-2.5 mb-4">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--main_l)' }}>
                    {icon}
                </span>
                <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
                    {subtitle && <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    )
}

function AttemptTable({ attempts }) {
    if (attempts.length === 0) {
        return <p className="text-sm text-[var(--text-secondary)] py-4 text-center">Chưa có ai làm bài.</p>
    }
    return (
        <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th className="px-2 py-2.5 font-semibold text-[var(--text-secondary)] text-xs">Người làm</th>
                        <th className="px-2 py-2.5 font-semibold text-[var(--text-secondary)] text-xs">Điểm</th>
                        <th className="px-2 py-2.5 font-semibold text-[var(--text-secondary)] text-xs">Kết quả</th>
                        <th className="px-2 py-2.5 font-semibold text-[var(--text-secondary)] text-xs">Thời gian</th>
                    </tr>
                </thead>
                <tbody>
                    {attempts.map(a => {
                        const name = a.userName || 'Ẩn danh'
                        return (
                            <tr key={a._id} className="hover:bg-[var(--hover)] transition-colors" style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td className="px-2 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'var(--main_d)' }}>
                                            {name.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="text-[var(--text-primary)]">{name}</span>
                                    </div>
                                </td>
                                <td className="px-2 py-2.5">
                                    <span className="text-base font-bold" style={{ color: a.passed ? 'var(--green)' : 'var(--red)' }}>
                                        {a.score}
                                    </span>
                                    <span className="text-xs text-[var(--text-secondary)]">/{a.total}</span>
                                </td>
                                <td className="px-2 py-2.5">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${a.passed ? 'bg-[#eaf7ee] text-[var(--green)]' : 'bg-[#fdecef] text-[var(--red)]'}`}>
                                        {a.passed ? 'Đạt' : 'Chưa đạt'}
                                    </span>
                                </td>
                                <td className="px-2 py-2.5 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                                    {new Date(a.createdAt).toLocaleString('vi-VN')}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

export default function QuizTab() {
    const [selectedRole, setSelectedRole] = useState('Admin')
    const [questions, setQuestions] = useState([])
    const [attempts, setAttempts] = useState([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [noti, setNoti] = useState({ open: false, status: false, message: '' })
    const [passPercent, setPassPercent] = useState(null)
    const [passSaving, setPassSaving] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const [importing, setImporting] = useState(false)

    const loadRole = useCallback(async (role) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/quiz?role=${role}&admin=1`)
            const json = await res.json()
            setQuestions(json.success && json.data ? json.data.questions || [] : [])
        } catch {
            setQuestions([])
        } finally {
            setLoading(false)
        }
    }, [])

    const loadAttempts = useCallback(async (role) => {
        try {
            const res = await fetch(`/api/quiz/attempt?role=${role}`)
            const json = await res.json()
            setAttempts(json.success ? json.data || [] : [])
        } catch {
            setAttempts([])
        }
    }, [])

    useEffect(() => {
        loadRole(selectedRole)
        loadAttempts(selectedRole)
    }, [selectedRole, loadRole, loadAttempts])

    useEffect(() => {
        ;(async () => {
            try {
                const [s, a] = await Promise.all([
                    fetch('/api/notifications/settings').then(r => r.json()),
                    fetch('/api/auth/me').then(r => r.json()),
                ])
                const setting = s.success ? s.data.find(x => x.key === 'quiz_pass_rate') : null
                const val = Number(setting?.value)
                setPassPercent(Number.isFinite(val) && val > 0 && val <= 1 ? Math.round(val * 100) : 80)
                setIsAdmin(a.user?.role?.some(r => /^admin$/i.test(r)) || false)
            } catch {
                setPassPercent(80)
                setIsAdmin(false)
            }
        })()
    }, [])

    const handleSavePassRate = async () => {
        const pct = Math.min(100, Math.max(1, Number(passPercent) || 80))
        setPassSaving(true)
        try {
            const res = await fetch('/api/notifications/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: [{ key: 'quiz_pass_rate', value: pct / 100 }] }),
            })
            const json = await res.json()
            if (json.success) {
                setPassPercent(pct)
                setNoti({ open: true, status: true, message: `Đã lưu ngưỡng đạt: ${pct}%` })
            } else {
                setNoti({ open: true, status: false, message: json.error || 'Lỗi khi lưu' })
            }
        } catch {
            setNoti({ open: true, status: false, message: 'Lỗi kết nối' })
        } finally {
            setPassSaving(false)
        }
    }

    const handleImport = async () => {
        setImporting(true)
        try {
            const res = await fetch('/api/import-defaults', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
            const json = await res.json()
            if (json.success) {
                setNoti({ open: true, status: true, message: json.message || 'Đã nhập dữ liệu mặc định' })
                await loadRole(selectedRole)
                await loadAttempts(selectedRole)
            } else {
                setNoti({ open: true, status: false, message: json.error || 'Lỗi khi nhập dữ liệu' })
            }
        } catch {
            setNoti({ open: true, status: false, message: 'Lỗi kết nối' })
        } finally {
            setImporting(false)
        }
    }

    const updateQuestion = (i, field, value) => {
        setQuestions(p => p.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
    }

    const updateOption = (qi, oi, value) => {
        setQuestions(p => p.map((q, idx) => {
            if (idx !== qi) return q
            const options = q.options.map((o, j) => j === oi ? value : o)
            return { ...q, options }
        }))
    }

    const addQuestion = () => setQuestions(p => [...p, { question: '', options: ['', '', '', ''], answerIndex: 0 }])
    const removeQuestion = (i) => setQuestions(p => p.filter((_, idx) => idx !== i))

    const handleSave = async () => {
        const invalid = questions.some(q => !q.question.trim())
        if (invalid) {
            setNoti({ open: true, status: false, message: 'Có câu hỏi chưa nhập nội dung. Vui lòng kiểm tra lại.' })
            return
        }
        const noOptions = questions.some(q => (q.options.filter(o => o.trim()).length) < 2)
        if (noOptions) {
            setNoti({ open: true, status: false, message: 'Mỗi câu cần ít nhất 2 tùy chọn có nội dung.' })
            return
        }
        setSaving(true)
        try {
            const res = await fetch('/api/quiz', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: selectedRole, questions }),
            })
            const json = await res.json()
            if (json.success) {
                setEditing(false)
                await loadRole(selectedRole)
                setNoti({ open: true, status: true, message: `Đã lưu bài kiểm tra cho ${selectedRole}` })
            } else {
                setNoti({ open: true, status: false, message: json.error || 'Lỗi khi lưu' })
            }
        } catch {
            setNoti({ open: true, status: false, message: 'Lỗi kết nối' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="flex items-center justify-center h-32 text-sm text-[var(--text-secondary)]">Đang tải...</div>

    const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm outline-none text-gray-700 focus:border-[var(--main_d)] transition-colors"

    return (
        <div className="max-w-2xl flex flex-col gap-5">
            <div className="flex flex-col gap-3">
                <div>
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-[var(--text-secondary)] mb-3">
                            Quản lý câu hỏi bài kiểm tra theo từng vai trò. Người dùng làm bài trong trang Thông tin; kết quả được chấm tự động và lưu lịch sử.
                        </p>
                        <button onClick={handleImport} disabled={importing}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40 cursor-pointer border-none shrink-0"
                            style={{ background: 'var(--main_d)' }}>
                            {importing ? 'Đang nhập...' : 'Nhập dữ liệu mặc định'}
                        </button>
                    </div>
                    <RoleTabs roles={ROLES} active={selectedRole} onChange={(r) => { setSelectedRole(r); setEditing(false) }} />
                </div>

                <SectionCard
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0374da" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>}
                    title="Ngưỡng đạt"
                    subtitle="Tỷ lệ trả lời đúng tối thiểu để được tính là Đạt (mặc định 80%)"
                >
                    <div className="flex items-center gap-2">
                        <input type="number" min={1} max={100} value={passPercent ?? ''}
                            disabled={!isAdmin}
                            onChange={e => setPassPercent(e.target.value)}
                            className={`${inputCls} w-32 disabled:opacity-50 disabled:cursor-not-allowed`} />
                        <span className="text-sm text-[var(--text-primary)]">%</span>
                        <button onClick={handleSavePassRate} disabled={passSaving || !isAdmin}
                            className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-40 cursor-pointer border-none"
                            style={{ background: 'var(--main_d)' }}>
                            {passSaving ? 'Đang lưu...' : 'Lưu'}
                        </button>
                        {!isAdmin && (
                            <span className="text-xs text-[var(--text-secondary)]">Chỉ Admin được thay đổi ngưỡng này.</span>
                        )}
                    </div>
                </SectionCard>

                <SectionCard
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0374da" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" /></svg>}
                    title="Soạn câu hỏi"
                    subtitle="Chọn radio để đánh dấu đáp án đúng"
                >
                    {!editing ? (
                        <div className="flex flex-col gap-3">
                            {questions.length === 0 && (
                                <p className="text-sm text-[var(--text-secondary)] text-center py-4">Chưa có câu hỏi cho vai trò này.</p>
                            )}
                            {questions.map((q, qi) => (
                                <div key={qi} className="rounded-xl p-4" style={{ border: '1px solid var(--border-color)', background: '#fafbfc' }}>
                                    <div className="flex items-start gap-2.5 mb-2.5">
                                        <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'var(--main_d)' }}>
                                            {qi + 1}
                                        </span>
                                        <p className="text-sm font-semibold text-[var(--text-primary)] pt-0.5">{q.question || '(chưa nhập câu hỏi)'}</p>
                                    </div>
                                    <div className="flex flex-col gap-1.5 pl-[26px]">
                                        {q.options.map((o, oi) => (
                                            <div key={oi} className="flex items-center gap-2">
                                                <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${oi === q.answerIndex ? 'bg-[var(--green)]' : 'bg-[var(--hover)]'}`}>
                                                    {oi === q.answerIndex && (
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                                    )}
                                                </span>
                                                <span className={`text-sm ${oi === q.answerIndex ? 'font-medium text-[var(--green)]' : 'text-[var(--text-primary)]'}`}>
                                                    {o || `(tùy chọn ${LETTERS[oi] || oi + 1})`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div>
                                <button onClick={() => setEditing(true)}
                                    className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90 cursor-pointer border-none"
                                    style={{ background: 'var(--main_d)' }}>
                                    Chỉnh sửa câu hỏi
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {questions.map((q, qi) => (
                                <div key={qi} className="rounded-xl p-4" style={{ border: '1px solid var(--border-color)' }}>
                                    <div className="flex items-start gap-2 mb-3">
                                        <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1" style={{ background: 'var(--main_d)' }}>
                                            {qi + 1}
                                        </span>
                                        <input type="text" value={q.question}
                                            onChange={e => updateQuestion(qi, 'question', e.target.value)}
                                            placeholder="Nội dung câu hỏi"
                                            className={inputCls} />
                                        <button onClick={() => removeQuestion(qi)}
                                            className="px-3 py-2 rounded-lg text-white text-xs font-medium transition-colors hover:opacity-90 cursor-pointer border-none mt-0.5 whitespace-nowrap"
                                            style={{ background: 'var(--red)' }}>
                                            Xóa
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-2 pl-8">
                                        {q.options.map((o, oi) => (
                                            <div key={oi} className="flex items-center gap-2">
                                                <label className="flex items-center gap-2 cursor-pointer shrink-0" title="Đáp án đúng">
                                                    <input type="radio" name={`q${qi}-answer`} checked={q.answerIndex === oi}
                                                        onChange={() => updateQuestion(qi, 'answerIndex', oi)} className="cursor-pointer" />
                                                    <span className="text-xs font-bold text-[var(--text-secondary)] w-4">{LETTERS[oi] || oi + 1}</span>
                                                </label>
                                                <input type="text" value={o}
                                                    onChange={e => updateOption(qi, oi, e.target.value)}
                                                    placeholder={`Tùy chọn ${LETTERS[oi] || oi + 1}`}
                                                    className={inputCls} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="flex flex-wrap items-center gap-2">
                                <button onClick={addQuestion}
                                    className="px-3 py-2 rounded-lg text-gray-700 text-sm font-medium transition-colors hover:bg-gray-200 cursor-pointer border-none"
                                    style={{ background: 'var(--bg-btn)' }}>
                                    + Thêm câu hỏi
                                </button>
                                <button onClick={handleSave} disabled={saving}
                                    className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-40 cursor-pointer border-none"
                                    style={{ background: 'var(--main_d)' }}>
                                    {saving ? 'Đang lưu...' : 'Lưu'}
                                </button>
                                <button onClick={() => { setEditing(false); loadRole(selectedRole) }}
                                    className="px-4 py-2 rounded-lg text-gray-700 text-sm font-medium transition-colors hover:bg-gray-200 cursor-pointer border-none"
                                    style={{ background: 'var(--bg-btn)' }}>
                                    Hủy
                                </button>
                            </div>
                        </div>
                    )}
                </SectionCard>
            </div>

            <SectionCard
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0374da" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}
                title={`Lịch sử làm bài (${selectedRole})`}
                subtitle="Các lượt làm bài gần nhất"
            >
                <AttemptTable attempts={attempts} />
            </SectionCard>

            <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.message}
                button={<button onClick={() => setNoti(p => ({ ...p, open: false }))}
                    className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2">Đóng</button>} />
        </div>
    )
}
