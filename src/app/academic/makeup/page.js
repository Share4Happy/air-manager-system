'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import DateInput from '@/components/(ui)/(input)/DateInput'

const statusMap = {
    MAKEUP_PENDING: { label: 'Chờ xếp lịch bù', color: 'bg-[#fff3e0] text-[#e65100]' },
    MAKEUP_REQUIRED: { label: 'Cần học bù', color: 'bg-[#fef3cd] text-[#856404]' },
    MAKEUP_SCHEDULED: { label: 'Đã xếp lịch bù', color: 'bg-[#e3f2fd] text-[#1565c0]' },
    MAKEUP_COMPLETED: { label: 'Đã học bù', color: 'bg-[#e8f5e9] text-[#2e7d32]' },
    MAKEUP_ABSENT: { label: 'Vắng buổi bù', color: 'bg-[#ffebee] text-[#c62828]' },
    MAKEUP_EXPIRED: { label: 'Quá hạn học bù', color: 'bg-[#f3e5f5] text-[#6a1b9a]' },
    MAKEUP_CANCELLED: { label: 'Hủy học bù', color: 'bg-[#eceff1] text-[#607d8b]' },
}

const needStatuses = ['MAKEUP_PENDING', 'MAKEUP_REQUIRED', 'MAKEUP_SCHEDULED']
const historyStatuses = ['MAKEUP_COMPLETED', 'MAKEUP_ABSENT', 'MAKEUP_EXPIRED', 'MAKEUP_CANCELLED']

export default function MakeupPage() {
    const [tab, setTab] = useState('need')
    const [sessions, setSessions] = useState([])
    const [incompleteCourses, setIncompleteCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        courseId: '',
        lessonId: '',
        studentId: '',
        makeupDate: '',
        makeupTime: '',
        contentToMakeup: '',
        note: '',
    })
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState('')
    const [expandedCourses, setExpandedCourses] = useState({})
    const [expandedStudents, setExpandedStudents] = useState({})
    const [searchQuery, setSearchQuery] = useState('')

    const fetchSessions = useCallback(async () => {
        setLoading(true)
        try {
            if (tab === 'incomplete') {
                const params = new URLSearchParams()
                if (searchQuery) params.set('q', searchQuery)
                const res = await fetch(`/api/academic/makeup-sessions/incomplete?${params}`)
                const json = await res.json()
                setIncompleteCourses(json.items || [])
            } else {
                const params = new URLSearchParams()
                if (statusFilter) {
                    params.set('status', statusFilter)
                } else {
                    params.set('scope', tab)
                }
                const res = await fetch(`/api/academic/makeup-sessions?${params}`)
                const json = await res.json()
                setSessions(json.items || [])
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [statusFilter, tab, searchQuery])

    useEffect(() => { fetchSessions() }, [fetchSessions])

    const handleSearch = () => { fetchSessions() }

    const handleTabChange = (newTab) => {
        setTab(newTab)
        setStatusFilter('')
    }

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await fetch(`/api/academic/makeup-sessions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ makeupStatus: newStatus }),
            })
            if (res.ok) {
                setMsg('Cập nhật trạng thái thành công')
                fetchSessions()
            }
        } catch (err) {
            console.error(err)
            setMsg('Lỗi khi cập nhật')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Xóa phiên học bù này?')) return
        try {
            const res = await fetch(`/api/academic/makeup-sessions/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setMsg('Đã xóa phiên học bù')
                fetchSessions()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/academic/makeup-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
            if (res.ok) {
                setMsg('Tạo yêu cầu học bù thành công')
                setShowForm(false)
                setFormData({ courseId: '', lessonId: '', studentId: '', makeupDate: '', makeupTime: '', contentToMakeup: '', note: '' })
                fetchSessions()
            } else {
                const err = await res.json()
                setMsg(err.error || 'Lỗi khi tạo')
            }
        } catch (err) {
            setMsg(err.message)
        } finally {
            setSaving(false)
        }
    }

    const toggleCourse = (courseId) => {
        setExpandedCourses(p => ({ ...p, [courseId]: !p[courseId] }))
    }

    const toggleStudent = (key) => {
        setExpandedStudents(p => ({ ...p, [key]: !p[key] }))
    }

    const currentFilters = tab === 'need' ? needStatuses : historyStatuses

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex gap-1 border-b border-[var(--border-color)]">
                <button onClick={() => handleTabChange('need')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'need' ? 'border-[#1565c0] text-[#1565c0]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                    Cần bù
                </button>
                <button onClick={() => handleTabChange('incomplete')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'incomplete' ? 'border-[#1565c0] text-[#1565c0]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                    Khóa cần bù
                </button>
                <button onClick={() => handleTabChange('history')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === 'history' ? 'border-[#1565c0] text-[#1565c0]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                    Lịch sử bù
                </button>
            </div>

            {tab !== 'incomplete' ? (
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex gap-1 flex-wrap">
                        <button onClick={() => setStatusFilter('')}
                            className={`text-xs px-3 py-1 rounded border ${statusFilter === '' ? 'bg-[#1565c0] text-white border-[#1565c0]' : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]'}`}>
                            Tất cả
                        </button>
                        {currentFilters.map(f => (
                            <button key={f} onClick={() => setStatusFilter(f)}
                                className={`text-xs px-3 py-1 rounded border ${statusFilter === f ? 'bg-[#1565c0] text-white border-[#1565c0]' : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]'}`}>
                                {statusMap[f]?.label || f}
                            </button>
                        ))}
                    </div>
                    {tab === 'need' && (
                        <button onClick={() => setShowForm(true)} className="text-xs px-4 py-1.5 rounded bg-[#1565c0] text-white hover:opacity-80 ml-auto">
                            + Tạo yêu cầu học bù
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <input
                        className="text-sm p-2 border rounded w-64"
                        placeholder="Tìm kiếm khóa học..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
                    />
                    <button onClick={handleSearch} className="text-xs px-3 py-1.5 rounded bg-[#1565c0] text-white hover:opacity-80">
                        Tìm
                    </button>
                </div>
            )}

            {msg && (
                <div className="px-4 py-2 rounded bg-[#e8f5e9] text-[#2e7d32] text-sm flex justify-between items-center">
                    <span>{msg}</span>
                    <button onClick={() => setMsg('')} className="text-[#2e7d32]">&times;</button>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
                    <div className="bg-[var(--bg-primary)] rounded-lg shadow-xl border border-[var(--border-color)] w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-color)]">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Tạo yêu cầu học bù</h3>
                            <button onClick={() => setShowForm(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-lg leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-5">
                            <input className="input text-sm p-2 border rounded" placeholder="Course ID" value={formData.courseId} onChange={e => setFormData(f => ({ ...f, courseId: e.target.value }))} required />
                            <input className="input text-sm p-2 border rounded" placeholder="Lesson ID" value={formData.lessonId} onChange={e => setFormData(f => ({ ...f, lessonId: e.target.value }))} required />
                            <input className="input text-sm p-2 border rounded" placeholder="Student ID (mã học sinh)" value={formData.studentId} onChange={e => setFormData(f => ({ ...f, studentId: e.target.value }))} required />
                            <DateInput className="input text-sm p-2 border rounded" placeholder="Ngày học bù" value={formData.makeupDate} onChange={v => setFormData(f => ({ ...f, makeupDate: v }))} />
                            <input className="input text-sm p-2 border rounded" type="time" placeholder="Giờ học bù" value={formData.makeupTime} onChange={e => setFormData(f => ({ ...f, makeupTime: e.target.value }))} />
                            <input className="input text-sm p-2 border rounded" placeholder="Nội dung cần bù" value={formData.contentToMakeup} onChange={e => setFormData(f => ({ ...f, contentToMakeup: e.target.value }))} />
                            <input className="input text-sm p-2 border rounded md:col-span-2" placeholder="Ghi chú" value={formData.note} onChange={e => setFormData(f => ({ ...f, note: e.target.value }))} />
                            <div className="md:col-span-2 flex gap-2 justify-end">
                                <button type="button" onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Hủy</button>
                                <button type="submit" disabled={saving} className="text-sm px-4 py-2 rounded bg-[#2e7d32] text-white hover:opacity-80 disabled:opacity-50">
                                    {saving ? 'Đang lưu...' : 'Tạo yêu cầu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {tab === 'incomplete' ? (
                loading ? (
                    <div className="flex items-center justify-center p-8"><p>Đang tải...</p></div>
                ) : incompleteCourses.length === 0 ? (
                    <div className="flex items-center justify-center p-8 bg-[var(--bg-primary)] rounded border border-[var(--border-color)]">
                        <p className="text-[var(--text-secondary)]">Không có khóa nào cần bù</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {incompleteCourses.map(c => (
                            <div key={c.course._id} className="bg-[var(--bg-primary)] rounded border border-[var(--border-color)] overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3">
                                    <button onClick={() => toggleCourse(c.course._id)}
                                        className="flex items-center gap-3 text-left hover:opacity-80">
                                        <span className={`text-sm transition-transform ${expandedCourses[c.course._id] ? 'rotate-90' : ''}`}>&#9654;</span>
                                        <div>
                                            <span className="text-sm font-medium text-[var(--text-primary)]">{c.course.Name}</span>
                                            <span className="text-xs text-[var(--text-secondary)] ml-2">({c.course.ID})</span>
                                        </div>
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[var(--text-secondary)]">
                                            {c.students.reduce((sum, s) => sum + s.missingLessons, 0)} buổi thiếu / {c.students.length} học sinh
                                        </span>
                                        <Link href={`/course/${c.course.ID || c.course._id}`} className="text-xs px-2 py-1 rounded bg-[#e3f2fd] text-[#1565c0] hover:opacity-80">
                                            Xem khóa học
                                        </Link>
                                    </div>
                                </div>
                                {expandedCourses[c.course._id] && (
                                    <div className="border-t border-[var(--border-color)] divide-y divide-[var(--border-color)]">
                                        {c.students.map(st => {
                                            const key = `${c.course._id}-${st.studentId}`
                                            return (
                                                <div key={st.studentId}>
                                                    <button onClick={() => toggleStudent(key)}
                                                        className="w-full flex items-center justify-between px-6 py-2.5 text-left hover:bg-[var(--bg-hover)]">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs transition-transform ${expandedStudents[key] ? 'rotate-90' : ''}`}>&#9654;</span>
                                                            <span className="text-sm text-[var(--text-primary)]">{st.studentName}</span>
                                                            <span className="text-xs text-[var(--text-secondary)]">({st.studentId})</span>
                                                        </div>
                                                        <span className="text-xs text-[#c62828]">thiếu {st.missingLessons}/{st.totalLessons} buổi</span>
                                                    </button>
                                                    {expandedStudents[key] && (
                                                        <div className="px-6 pb-2">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="border-b border-[var(--border-color)] text-left text-[var(--text-secondary)]">
                                                                        <th className="py-1.5 pr-2">Ngày</th>
                                                                        <th className="py-1.5 pr-2">Giờ</th>
                                                                        <th className="py-1.5">Chủ đề</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {st.missingDetail.map(d => (
                                                                        <tr key={d.lessonId} className="border-b border-[var(--border-color)]/50">
                                                                            <td className="py-1.5 pr-2 text-[var(--text-primary)]">
                                                                                {d.Day ? new Date(d.Day).toLocaleDateString('vi-VN') : '—'}
                                                                            </td>
                                                                            <td className="py-1.5 pr-2 text-[var(--text-primary)]">{d.Time || '—'}</td>
                                                                            <td className="py-1.5 text-[var(--text-primary)]">{d.Topic?.Name || d.Topic || '—'}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <>
                    {loading ? (
                        <div className="flex items-center justify-center p-8"><p>Đang tải...</p></div>
                    ) : sessions.length === 0 ? (
                        <div className="flex items-center justify-center p-8 bg-[var(--bg-primary)] rounded border border-[var(--border-color)]">
                            <p className="text-[var(--text-secondary)]">Không có phiên học bù nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-[var(--bg-primary)] rounded border border-[var(--border-color)]">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border-color)] text-left">
                                        <th className="p-3 font-medium text-[var(--text-primary)]">Học sinh</th>
                                        <th className="p-3 font-medium text-[var(--text-primary)]">Khóa học</th>
                                        <th className="p-3 font-medium text-[var(--text-primary)]">Nội dung cần bù</th>
                                        <th className="p-3 font-medium text-[var(--text-primary)]">Lịch bù</th>
                                        <th className="p-3 font-medium text-[var(--text-primary)]">Trạng thái</th>
                                        {tab === 'need' && <th className="p-3 font-medium text-[var(--text-primary)]">Hành động</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.map(s => {
                                        const st = statusMap[s.makeupStatus] || { label: s.makeupStatus, color: '' }
                                        return (
                                            <tr key={s._id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                                                <td className="p-3 text-[var(--text-primary)]">{s.studentName}</td>
                                                <td className="p-3 text-[var(--text-primary)]">{s.course?.Name || s.course?.ID || 'N/A'}</td>
                                                <td className="p-3 text-[var(--text-primary)]">{s.contentToMakeup || '—'}</td>
                                                <td className="p-3 text-[var(--text-primary)]">
                                                    {s.makeupDate ? new Date(s.makeupDate).toLocaleDateString('vi-VN') : '—'}
                                                    {s.makeupTime ? ` ${s.makeupTime}` : ''}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.color}`}>{st.label}</span>
                                                </td>
                                                {tab === 'need' && (
                                                    <td className="p-3 flex gap-1">
                                                        {s.makeupStatus === 'MAKEUP_PENDING' && (
                                                            <button onClick={() => handleStatusChange(s._id, 'MAKEUP_SCHEDULED')}
                                                                className="text-xs px-2 py-1 rounded bg-[#e3f2fd] text-[#1565c0]">Xếp lịch</button>
                                                        )}
                                                        {s.makeupStatus === 'MAKEUP_SCHEDULED' && (
                                                            <button onClick={() => handleStatusChange(s._id, 'MAKEUP_COMPLETED')}
                                                                className="text-xs px-2 py-1 rounded bg-[#e8f5e9] text-[#2e7d32]">Xác nhận đã học</button>
                                                        )}
                                                        {['MAKEUP_PENDING', 'MAKEUP_SCHEDULED'].includes(s.makeupStatus) && (
                                                            <button onClick={() => handleStatusChange(s._id, 'MAKEUP_CANCELLED')}
                                                                className="text-xs px-2 py-1 rounded bg-[#ffebee] text-[#c62828]">Hủy</button>
                                                        )}
                                                        <button onClick={() => handleDelete(s._id)}
                                                            className="text-xs px-2 py-1 rounded bg-[#eceff1] text-[#607d8b]">Xóa</button>
                                                        {s.course && (
                                                            <Link href={`/course/${s.course.ID || s.course._id}`} className="text-xs px-2 py-1 rounded bg-[#f1f3f5] text-[#6c757d]">
                                                                Khóa học
                                                            </Link>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
