'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import DateInput from '@/components/(ui)/(input)/DateInput'
import {
    Svg_Canlendar,
    Svg_History,
    Svg_Reload,
    Svg_Delete,
    Svg_Course,
    Svg_Add,
    Svg_Close,
    Svg_Waring,
    Svg_Check
} from '@/components/(icon)/svg'

// Inline SVG Icon Helpers
function SearchIcon({ className = "w-4 h-4 text-[var(--text-secondary)]" }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    )
}

function ClockIcon({ className = "w-3.5 h-3.5 text-[var(--text-secondary)]" }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}

function ChevronRightIcon({ className = "w-3.5 h-3.5" }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    )
}

function ExternalLinkIcon({ className = "w-3 h-3" }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    )
}

function BookIcon({ className = "w-3.5 h-3.5 text-[var(--text-secondary)]" }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    )
}

function EmptyBoxIcon({ className = "w-10 h-10 text-[var(--text-secondary)]/40" }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
        </svg>
    )
}

function SpinnerIcon({ className = "w-4 h-4 animate-spin" }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    )
}

const statusMap = {
    MAKEUP_PENDING: { label: 'Chờ xếp lịch', color: 'bg-amber-50 text-amber-700 border border-amber-200' },
    MAKEUP_REQUIRED: { label: 'Cần học bù', color: 'bg-orange-50 text-orange-700 border border-orange-200' },
    MAKEUP_SCHEDULED: { label: 'Đã xếp lịch', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
    MAKEUP_COMPLETED: { label: 'Đã học bù', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    MAKEUP_ABSENT: { label: 'Vắng buổi bù', color: 'bg-rose-50 text-rose-700 border border-rose-200' },
    MAKEUP_EXPIRED: { label: 'Quá hạn', color: 'bg-purple-50 text-purple-700 border border-purple-200' },
    MAKEUP_CANCELLED: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-600 border border-slate-200' },
}

const needStatuses = ['MAKEUP_PENDING', 'MAKEUP_REQUIRED', 'MAKEUP_SCHEDULED']
const historyStatuses = ['MAKEUP_COMPLETED', 'MAKEUP_ABSENT', 'MAKEUP_EXPIRED', 'MAKEUP_CANCELLED']

export default function MakeupPage() {
    const [tab, setTab] = useState('incomplete') // 'incomplete' | 'need' | 'history'
    const [sessions, setSessions] = useState([])
    const [incompleteCourses, setIncompleteCourses] = useState([])
    const [stats, setStats] = useState({ total: 0, byStatus: {} })
    const [options, setOptions] = useState({ teachers: [], rooms: [], courses: [], books: [] })
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState({ text: '', type: 'success' })
    const [expandedCourses, setExpandedCourses] = useState({})
    const [expandedStudents, setExpandedStudents] = useState({})

    const [formData, setFormData] = useState({
        courseId: '',
        lessonId: '',
        studentId: '',
        makeupDate: '',
        makeupTime: '18:00 - 19:30',
        makeupTeacher: '',
        room: '',
        contentToMakeup: '',
        note: '',
    })

    // Tải danh sách Options (Giáo viên, phòng học, khóa học)
    const fetchOptions = useCallback(async () => {
        try {
            const res = await fetch('/api/academic/makeup-sessions/options')
            if (res.ok) {
                const data = await res.json()
                setOptions(data)
            }
        } catch (err) {
            console.error('Fetch options error:', err)
        }
    }, [])

    // Tải thống kê
    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/academic/makeup-sessions/stats')
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (err) {
            console.error('Fetch stats error:', err)
        }
    }, [])

    // Tải danh sách ca học bù / Lớp cần bù
    const fetchSessions = useCallback(async () => {
        setLoading(true)
        try {
            if (tab === 'incomplete') {
                const params = new URLSearchParams()
                if (searchQuery) params.set('q', searchQuery)
                const res = await fetch(`/api/academic/makeup-sessions/incomplete?${params}`)
                const json = await res.json()
                setIncompleteCourses(json.items || json.courses || [])
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

    useEffect(() => {
        fetchOptions()
        fetchStats()
    }, [fetchOptions, fetchStats])

    useEffect(() => {
        fetchSessions()
    }, [fetchSessions])

    const handleTabChange = (newTab) => {
        setTab(newTab)
        setStatusFilter('')
        setSearchQuery('')
    }

    const showNotification = (text, type = 'success') => {
        setMsg({ text, type })
        setTimeout(() => setMsg({ text: '', type: 'success' }), 4000)
    }

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await fetch(`/api/academic/makeup-sessions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ makeupStatus: newStatus }),
            })
            if (res.ok) {
                showNotification('Cập nhật trạng thái thành công!', 'success')
                fetchSessions()
                fetchStats()
            } else {
                showNotification('Có lỗi khi cập nhật trạng thái', 'error')
            }
        } catch (err) {
            console.error(err)
            showNotification('Lỗi kết nối máy chủ', 'error')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa phiên học bù này không?')) return
        try {
            const res = await fetch(`/api/academic/makeup-sessions/${id}`, { method: 'DELETE' })
            if (res.ok) {
                showNotification('Đã xóa phiên học bù thành công', 'success')
                fetchSessions()
                fetchStats()
            }
        } catch (err) {
            console.error(err)
            showNotification('Lỗi khi xóa phiên học bù', 'error')
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
                showNotification('Tạo yêu cầu học bù thành công!', 'success')
                setShowForm(false)
                setFormData({
                    courseId: '',
                    lessonId: '',
                    studentId: '',
                    makeupDate: '',
                    makeupTime: '18:00 - 19:30',
                    makeupTeacher: '',
                    room: '',
                    contentToMakeup: '',
                    note: '',
                })
                fetchSessions()
                fetchStats()
            } else {
                const err = await res.json()
                showNotification(err.error || 'Lỗi khi tạo yêu cầu', 'error')
            }
        } catch (err) {
            showNotification(err.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const openQuickSchedule = (courseId, studentId, lessonId, topicName) => {
        setFormData(f => ({
            ...f,
            courseId: courseId || '',
            studentId: studentId || '',
            lessonId: lessonId || '',
            makeupDate: new Date().toISOString().split('T')[0],
            makeupTime: '18:00 - 19:30',
            makeupTeacher: f.makeupTeacher || (options.teachers[0]?._id || ''),
            room: f.room || (options.rooms[0]?._id || ''),
            contentToMakeup: topicName ? `Bù bài: ${topicName}` : '',
            note: '',
        }))
        setShowForm(true)
    }

    const toggleCourse = (courseId) => {
        setExpandedCourses(p => ({ ...p, [courseId]: !p[courseId] }))
    }

    const toggleStudent = (key) => {
        setExpandedStudents(p => ({ ...p, [key]: !p[key] }))
    }

    // Lọc theo search input client-side cho tab need và history
    const filteredSessions = useMemo(() => {
        if (!searchQuery) return sessions
        const q = searchQuery.toLowerCase()
        return sessions.filter(s =>
            (s.studentName && s.studentName.toLowerCase().includes(q)) ||
            (s.studentId && s.studentId.toLowerCase().includes(q)) ||
            (s.course?.Name && s.course.Name.toLowerCase().includes(q)) ||
            (s.course?.ID && s.course.ID.toLowerCase().includes(q)) ||
            (s.contentToMakeup && s.contentToMakeup.toLowerCase().includes(q))
        )
    }, [sessions, searchQuery])

    const currentFilters = tab === 'need' ? needStatuses : historyStatuses

    return (
        <div className="flex flex-col gap-5 p-4 md:p-6 max-w-[1600px] mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <span>Quản lý học bù</span>
                    </h1>
                    <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-0.5">
                        Theo dõi danh sách học sinh cần học bù, xếp lịch bù riêng và đồng bộ tiến độ học tập
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { fetchSessions(); fetchStats(); }}
                        className="p-2 md:px-3.5 md:py-2 text-xs md:text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2"
                        title="Tải lại dữ liệu"
                    >
                        <Svg_Reload w="14" h="14" c="currentColor" />
                        <span className="hidden sm:inline">Làm mới</span>
                    </button>
                    <button
                        onClick={() => {
                            setFormData({
                                courseId: '',
                                lessonId: '',
                                studentId: '',
                                makeupDate: '',
                                makeupTime: '18:00 - 19:30',
                                makeupTeacher: '',
                                room: '',
                                contentToMakeup: '',
                                note: '',
                            })
                            setShowForm(true)
                        }}
                        className="px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg bg-[#1565c0] hover:bg-[#0d47a1] text-white shadow-sm transition-all flex items-center gap-2"
                    >
                        <Svg_Add w="13" h="13" c="white" />
                        <span>Tạo buổi bù riêng</span>
                    </button>
                </div>
            </div>

            {/* Notification Toast */}
            {msg.text && (
                <div className={`px-4 py-2.5 rounded-lg text-sm flex justify-between items-center transition-all ${
                    msg.type === 'error'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                    <span className="flex items-center gap-2">
                        {msg.type === 'error' ? (
                            <Svg_Waring w="16" h="16" c="#b91c1c" />
                        ) : (
                            <Svg_Check w="16" h="16" c="#15803d" />
                        )}
                        <span>{msg.text}</span>
                    </span>
                    <button
                        onClick={() => setMsg({ text: '', type: 'success' })}
                        className="p-1 rounded hover:bg-black/5 transition-colors leading-none"
                    >
                        <Svg_Close w="12" h="12" c="currentColor" />
                    </button>
                </div>
            )}

            {/* Main Panel Card */}
            <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-xs overflow-hidden flex flex-col">
                {/* Navigation Tabs */}
                <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 pt-2 bg-[var(--bg-secondary)]/30 overflow-x-auto">
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleTabChange('incomplete')}
                            className={`px-4 py-2.5 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 -mb-px whitespace-nowrap ${
                                tab === 'incomplete'
                                    ? 'border-[#1565c0] text-[#1565c0]'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <Svg_Course w="14" h="14" c="currentColor" />
                            <span>Lớp cần bù</span>
                            {incompleteCourses.length > 0 && (
                                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 font-medium">
                                    {incompleteCourses.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('need')}
                            className={`px-4 py-2.5 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 -mb-px whitespace-nowrap ${
                                tab === 'need'
                                    ? 'border-[#1565c0] text-[#1565c0]'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <Svg_Canlendar w="14" h="14" c="currentColor" />
                            <span>Cần bù</span>
                            {(stats.byStatus?.MAKEUP_PENDING || 0) + (stats.byStatus?.MAKEUP_REQUIRED || 0) > 0 && (
                                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-medium">
                                    {(stats.byStatus?.MAKEUP_PENDING || 0) + (stats.byStatus?.MAKEUP_REQUIRED || 0)}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('history')}
                            className={`px-4 py-2.5 text-xs md:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 -mb-px whitespace-nowrap ${
                                tab === 'history'
                                    ? 'border-[#1565c0] text-[#1565c0]'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <Svg_History w="14" h="14" c="currentColor" />
                            <span>Lịch sử bù</span>
                            {(stats.byStatus?.MAKEUP_COMPLETED || 0) > 0 && (
                                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                                    {stats.byStatus?.MAKEUP_COMPLETED || 0}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="p-4 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--bg-primary)]">
                    {/* Search Input */}
                    <div className="relative w-full md:w-80">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2">
                            <SearchIcon />
                        </span>
                        <input
                            className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#1565c0]"
                            placeholder={tab === 'incomplete' ? 'Tìm tên/mã khóa học...' : 'Tìm học sinh, khóa học, bài học...'}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Status Filter Chips (For need & history tabs) */}
                    {tab !== 'incomplete' && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                                onClick={() => setStatusFilter('')}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                                    statusFilter === ''
                                        ? 'bg-[#1565c0] text-white border-[#1565c0] font-medium'
                                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                                }`}
                            >
                                Tất cả
                            </button>
                            {currentFilters.map(f => (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f)}
                                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                                        statusFilter === f
                                            ? 'bg-[#1565c0] text-white border-[#1565c0] font-medium'
                                            : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                                    }`}
                                >
                                    {statusMap[f]?.label || f}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--text-secondary)]">
                            <SpinnerIcon className="w-6 h-6 text-[#1565c0]" />
                            <p className="text-sm">Đang tải dữ liệu học bù...</p>
                        </div>
                    ) : tab === 'incomplete' ? (
                        /* Tab: Lớp cần bù */
                        incompleteCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 gap-2 text-[var(--text-secondary)]">
                                <EmptyBoxIcon />
                                <p className="text-sm font-medium">Tuyệt vời! Không có lớp học nào có học sinh bị thiếu buổi cần bù.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {incompleteCourses.map(c => {
                                    const totalMissingInCourse = c.students.reduce((sum, s) => sum + s.missingLessons, 0)
                                    const isExpanded = expandedCourses[c.course?._id || c.courseId]

                                    return (
                                        <div
                                            key={c.course?._id || c.courseId}
                                            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] overflow-hidden transition-all shadow-2xs"
                                        >
                                            {/* Course Row Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 md:p-4 gap-3 bg-[var(--bg-secondary)]/20 hover:bg-[var(--bg-hover)]/60 transition-colors">
                                                <button
                                                    onClick={() => toggleCourse(c.course?._id || c.courseId)}
                                                    className="flex items-center gap-3 text-left flex-1"
                                                >
                                                    <span className={`w-6 h-6 rounded-md bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                                        <ChevronRightIcon />
                                                    </span>
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center flex-wrap gap-2">
                                                            <span className="text-sm md:text-base font-bold text-[var(--text-primary)]">
                                                                {c.course?.Name || c.courseName}
                                                            </span>
                                                            <span className="text-xs text-[var(--text-secondary)] font-mono">
                                                                ({c.course?.ID || c.courseName})
                                                            </span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                                                c.course?.Status
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                            }`}>
                                                                {c.statusText || (c.course?.Status ? 'Đang diễn ra' : 'Đã kết thúc (< 2 tuần)')}
                                                            </span>
                                                        </div>
                                                        {c.bookName && c.bookName !== 'N/A' && (
                                                            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                                                                <BookIcon />
                                                                <span>Giáo trình: {c.bookName}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>

                                                <div className="flex items-center justify-between sm:justify-end gap-3 pl-9 sm:pl-0">
                                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                                                        {totalMissingInCourse} buổi thiếu / {c.students.length} học sinh
                                                    </span>
                                                    <Link
                                                        href={`/course/${c.course?.ID || c.course?._id || c.courseName}`}
                                                        className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-[#e3f2fd] text-[#1565c0] hover:bg-[#bbdefb] transition-colors flex items-center gap-1"
                                                    >
                                                        <span>Xem khóa</span>
                                                        <ExternalLinkIcon />
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* Expandable Students List */}
                                            {isExpanded && (
                                                <div className="border-t border-[var(--border-color)] divide-y divide-[var(--border-color)] bg-[var(--bg-primary)]">
                                                    {c.students.map(st => {
                                                        const key = `${c.course?._id || c.courseId}-${st.studentId}`
                                                        const isStudentExpanded = expandedStudents[key]

                                                        return (
                                                            <div key={st.studentId} className="flex flex-col">
                                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 gap-2 hover:bg-[var(--bg-hover)]/40 transition-colors">
                                                                    <button
                                                                        onClick={() => toggleStudent(key)}
                                                                        className="flex items-center gap-2.5 text-left flex-1"
                                                                    >
                                                                        <span className={`text-[var(--text-secondary)] transition-transform ${isStudentExpanded ? 'rotate-90' : ''}`}>
                                                                            <ChevronRightIcon className="w-3 h-3" />
                                                                        </span>
                                                                        <span className="w-6 h-6 rounded-full bg-blue-50 text-[#1565c0] flex items-center justify-center text-xs font-bold">
                                                                            {st.studentName ? st.studentName.charAt(0) : 'S'}
                                                                        </span>
                                                                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                                                                            {st.studentName}
                                                                        </span>
                                                                        <span className="text-xs text-[var(--text-secondary)] font-mono">
                                                                            ({st.studentId})
                                                                        </span>
                                                                    </button>

                                                                    <div className="flex items-center gap-2.5 pl-6 sm:pl-0">
                                                                        <span className="text-xs text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                                                            Thiếu {st.missingLessons}/{st.pastLessons || st.totalLessons} buổi đã học
                                                                        </span>
                                                                        <button
                                                                            onClick={() => openQuickSchedule(
                                                                                c.course?._id || c.courseId,
                                                                                st.studentId,
                                                                                st.missingDetail?.[0]?.lessonId,
                                                                                st.missingDetail?.[0]?.Topic?.Name
                                                                            )}
                                                                            className="text-xs px-2.5 py-1 rounded-md bg-[#1565c0] hover:bg-[#0d47a1] text-white font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
                                                                        >
                                                                            <Svg_Add w="11" h="11" c="white" />
                                                                            <span>Xếp bù ngay</span>
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Missing Lessons Table */}
                                                                {isStudentExpanded && (
                                                                    <div className="px-5 pb-3 pt-1 pl-12">
                                                                        <div className="rounded-lg border border-[var(--border-color)] overflow-hidden bg-[var(--bg-secondary)]/30">
                                                                            <table className="w-full text-xs">
                                                                                <thead>
                                                                                    <tr className="border-b border-[var(--border-color)] text-left text-[var(--text-secondary)] bg-[var(--bg-secondary)]/50">
                                                                                        <th className="py-2 px-3 font-semibold">Ngày học</th>
                                                                                        <th className="py-2 px-3 font-semibold">Khung giờ</th>
                                                                                        <th className="py-2 px-3 font-semibold">Chủ đề bài học</th>
                                                                                        <th className="py-2 px-3 font-semibold text-right">Thao tác</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-[var(--border-color)]">
                                                                                    {st.missingDetail.map(d => (
                                                                                        <tr key={d.lessonId} className="hover:bg-[var(--bg-hover)] transition-colors">
                                                                                            <td className="py-2 px-3 font-medium text-[var(--text-primary)]">
                                                                                                <div className="flex items-center gap-1.5">
                                                                                                    <Svg_Canlendar w="12" h="12" c="var(--text-secondary)" />
                                                                                                    <span>{d.Day ? new Date(d.Day).toLocaleDateString('vi-VN') : '—'}</span>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="py-2 px-3 text-[var(--text-secondary)] font-mono">
                                                                                                <div className="flex items-center gap-1.5">
                                                                                                    <ClockIcon />
                                                                                                    <span>{d.Time || '—'}</span>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="py-2 px-3 font-medium text-[var(--text-primary)]">
                                                                                                {d.Topic?.Name || d.Topic || 'Chủ đề bài học'}
                                                                                            </td>
                                                                                            <td className="py-2 px-3 text-right">
                                                                                                <button
                                                                                                    onClick={() => openQuickSchedule(
                                                                                                        c.course?._id || c.courseId,
                                                                                                        st.studentId,
                                                                                                        d.lessonId,
                                                                                                        d.Topic?.Name
                                                                                                    )}
                                                                                                    className="text-[11px] px-2.5 py-0.5 rounded text-[#1565c0] hover:bg-[#e3f2fd] border border-[#1565c0]/30 transition-colors inline-flex items-center gap-1"
                                                                                                >
                                                                                                    <span>Xếp bài này</span>
                                                                                                </button>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    ) : (
                        /* Tab: Cần bù & Lịch sử bù */
                        filteredSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 gap-2 text-[var(--text-secondary)]">
                                <EmptyBoxIcon />
                                <p className="text-sm font-medium">Không có ca học bù nào phù hợp với bộ lọc.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-[var(--border-color)]">
                                <table className="w-full text-xs md:text-sm text-left">
                                    <thead>
                                        <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/40 text-[var(--text-secondary)] font-semibold">
                                            <th className="p-3">Học sinh</th>
                                            <th className="p-3">Khóa học</th>
                                            <th className="p-3">Nội dung cần bù</th>
                                            <th className="p-3">Lịch học bù</th>
                                            <th className="p-3">Trạng thái</th>
                                            <th className="p-3 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {filteredSessions.map(s => {
                                            const st = statusMap[s.makeupStatus] || { label: s.makeupStatus, color: 'bg-gray-100 text-gray-700' }

                                            return (
                                                <tr key={s._id} className="hover:bg-[var(--bg-hover)] transition-colors">
                                                    {/* Học sinh */}
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="w-7 h-7 rounded-full bg-blue-50 text-[#1565c0] flex items-center justify-center font-bold text-xs">
                                                                {s.studentName ? s.studentName.charAt(0) : 'S'}
                                                            </span>
                                                            <div>
                                                                <div className="font-semibold text-[var(--text-primary)]">{s.studentName}</div>
                                                                <div className="text-[11px] text-[var(--text-secondary)] font-mono">{s.studentId}</div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Khóa học */}
                                                    <td className="p-3">
                                                        <div className="font-medium text-[var(--text-primary)]">
                                                            {s.course?.Name || s.course?.ID || 'N/A'}
                                                        </div>
                                                        {s.isTeacherCreated && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 inline-block mt-0.5 font-medium">
                                                                Giáo viên tạo
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Nội dung */}
                                                    <td className="p-3">
                                                        <span className="text-[var(--text-primary)]">{s.contentToMakeup || '—'}</span>
                                                        {s.note && (
                                                            <div className="text-[11px] text-[var(--text-secondary)] italic mt-0.5">
                                                                Ghi chú: {s.note}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Lịch bù */}
                                                    <td className="p-3">
                                                        {s.makeupDate ? (
                                                            <div className="flex flex-col gap-0.5">
                                                                <div className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                                                                    <Svg_Canlendar w="13" h="13" c="var(--text-secondary)" />
                                                                    <span>{new Date(s.makeupDate).toLocaleDateString('vi-VN')}</span>
                                                                </div>
                                                                <div className="text-[11px] text-[var(--text-secondary)] font-mono flex items-center gap-1.5">
                                                                    <ClockIcon />
                                                                    <span>{s.makeupTime || '—'}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[var(--text-secondary)] italic">Chưa xếp lịch</span>
                                                        )}
                                                    </td>

                                                    {/* Trạng thái */}
                                                    <td className="p-3">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-block ${st.color}`}>
                                                            {st.label}
                                                        </span>
                                                    </td>

                                                    {/* Thao tác */}
                                                    <td className="p-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                            {s.makeupStatus === 'MAKEUP_PENDING' && (
                                                                <button
                                                                    onClick={() => handleStatusChange(s._id, 'MAKEUP_SCHEDULED')}
                                                                    className="text-xs px-2.5 py-1 rounded bg-[#e3f2fd] text-[#1565c0] hover:bg-[#bbdefb] font-medium transition-colors"
                                                                >
                                                                    Xếp lịch
                                                                </button>
                                                            )}
                                                            {s.makeupStatus === 'MAKEUP_SCHEDULED' && (
                                                                <button
                                                                    onClick={() => handleStatusChange(s._id, 'MAKEUP_COMPLETED')}
                                                                    className="text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-medium transition-colors"
                                                                >
                                                                    Đã học bù
                                                                </button>
                                                            )}
                                                            {['MAKEUP_PENDING', 'MAKEUP_SCHEDULED'].includes(s.makeupStatus) && (
                                                                <button
                                                                    onClick={() => handleStatusChange(s._id, 'MAKEUP_CANCELLED')}
                                                                    className="text-xs px-2.5 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-medium transition-colors"
                                                                >
                                                                    Hủy
                                                                </button>
                                                            )}
                                                            {s.course && (
                                                                <Link
                                                                    href={`/course/${s.course.ID || s.course._id}`}
                                                                    className="text-xs px-2.5 py-1 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                                                                >
                                                                    <span>Khóa</span>
                                                                    <ExternalLinkIcon />
                                                                </Link>
                                                            )}
                                                            <button
                                                                onClick={() => handleDelete(s._id)}
                                                                className="p-1.5 rounded hover:bg-rose-50 text-[var(--text-secondary)] hover:text-rose-600 transition-colors"
                                                                title="Xóa yêu cầu"
                                                            >
                                                                <Svg_Delete w="13" h="13" c="currentColor" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Modal Tạo Yêu Cầu Học Bù Riêng */}
            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
                    onClick={() => setShowForm(false)}
                >
                    <div
                        className="bg-[var(--bg-primary)] rounded-2xl shadow-2xl border border-[var(--border-color)] w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/40">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1565c0] flex items-center justify-center">
                                    <Svg_Canlendar w="18" h="18" c="#1565c0" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[var(--text-primary)]">Tạo ca học bù riêng</h3>
                                    <p className="text-xs text-[var(--text-secondary)]">Điền thông tin buổi học bù để thêm vào lịch và điểm danh</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowForm(false)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                            >
                                <Svg_Close w="14" h="14" c="currentColor" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleCreate} className="p-6 flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {/* Khóa học */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-[var(--text-primary)]">Khóa học <span className="text-rose-500">*</span></label>
                                    <select
                                        className="text-xs md:text-sm p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[#1565c0]"
                                        value={formData.courseId}
                                        onChange={e => setFormData(f => ({ ...f, courseId: e.target.value }))}
                                        required
                                    >
                                        <option value="">-- Chọn khóa học --</option>
                                        {options.courses.map(c => (
                                            <option key={c._id} value={c._id}>
                                                {c.ID} {c.Status ? '(Đang học)' : '(Đã kết thúc)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Mã học sinh */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-[var(--text-primary)]">Mã học sinh <span className="text-rose-500">*</span></label>
                                    <input
                                        className="text-xs md:text-sm p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[#1565c0]"
                                        placeholder="Ví dụ: HS00124"
                                        value={formData.studentId}
                                        onChange={e => setFormData(f => ({ ...f, studentId: e.target.value }))}
                                        required
                                    />
                                </div>

                                {/* Giáo viên phụ trách */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-[var(--text-primary)]">Giáo viên phụ trách</label>
                                    <select
                                        className="text-xs md:text-sm p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[#1565c0]"
                                        value={formData.makeupTeacher}
                                        onChange={e => setFormData(f => ({ ...f, makeupTeacher: e.target.value }))}
                                    >
                                        <option value="">-- Chọn giáo viên --</option>
                                        {options.teachers.map(t => (
                                            <option key={t._id} value={t._id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Phòng học */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-[var(--text-primary)]">Phòng học</label>
                                    <select
                                        className="text-xs md:text-sm p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[#1565c0]"
                                        value={formData.room}
                                        onChange={e => setFormData(f => ({ ...f, room: e.target.value }))}
                                    >
                                        <option value="">-- Chọn phòng học --</option>
                                        {options.rooms.map(r => (
                                            <option key={r._id} value={r._id}>{r.fullName || r.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Ngày học bù */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-[var(--text-primary)]">Ngày học bù</label>
                                    <DateInput
                                        className="text-xs md:text-sm p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                                        placeholder="Chọn ngày học bù"
                                        value={formData.makeupDate}
                                        onChange={v => setFormData(f => ({ ...f, makeupDate: v }))}
                                    />
                                </div>

                                {/* Khung giờ học */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-[var(--text-primary)]">Khung giờ</label>
                                    <input
                                        className="text-xs md:text-sm p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[#1565c0]"
                                        placeholder="Ví dụ: 18:00 - 19:30"
                                        value={formData.makeupTime}
                                        onChange={e => setFormData(f => ({ ...f, makeupTime: e.target.value }))}
                                    />
                                </div>

                                {/* Nội dung cần bù */}
                                <div className="flex flex-col gap-1 md:col-span-2">
                                    <label className="text-xs font-semibold text-[var(--text-primary)]">Nội dung / Chủ đề cần bù</label>
                                    <input
                                        className="text-xs md:text-sm p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[#1565c0]"
                                        placeholder="Ví dụ: Bù bài Chủ đề 4: Lắp ráp xe dò đường"
                                        value={formData.contentToMakeup}
                                        onChange={e => setFormData(f => ({ ...f, contentToMakeup: e.target.value }))}
                                    />
                                </div>

                                {/* Ghi chú */}
                                <div className="flex flex-col gap-1 md:col-span-2">
                                    <label className="text-xs font-semibold text-[var(--text-primary)]">Ghi chú thêm</label>
                                    <textarea
                                        rows={2}
                                        className="text-xs md:text-sm p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[#1565c0] resize-none"
                                        placeholder="Ghi chú thêm cho giáo viên hoặc phụ huynh..."
                                        value={formData.note}
                                        onChange={e => setFormData(f => ({ ...f, note: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-color)] mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="text-xs md:text-sm px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="text-xs md:text-sm font-medium px-5 py-2 rounded-lg bg-[#1565c0] hover:bg-[#0d47a1] text-white shadow-xs transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? <SpinnerIcon className="w-3.5 h-3.5" /> : <Svg_Check w="12" h="12" c="white" />}
                                    <span>{saving ? 'Đang lưu...' : 'Xác nhận tạo ca bù'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
