'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import DateInput from '@/components/(ui)/(input)/DateInput'
import CenterPopup from '@/components/(features)/(popup)/popup_center'
import Title from '@/components/(features)/(popup)/title'
import {
    Svg_Reload,
    Svg_Delete,
    Svg_Add,
    Svg_Close,
    Svg_Waring,
    Svg_Check
} from '@/components/(icon)/svg'

function ExternalLinkIcon({ className = "w-3 h-3" }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    )
}

const statusMap = {
    MAKEUP_PENDING: { label: 'Chờ xếp lịch', color: 'bg-amber-100 text-amber-700' },
    MAKEUP_REQUIRED: { label: 'Cần học bù', color: 'bg-orange-100 text-orange-700' },
    MAKEUP_SCHEDULED: { label: 'Đã xếp lịch', color: 'bg-blue-100 text-blue-700' },
    MAKEUP_COMPLETED: { label: 'Đã học bù', color: 'bg-green-100 text-green-700' },
    MAKEUP_ABSENT: { label: 'Vắng buổi bù', color: 'bg-red-100 text-red-700' },
    MAKEUP_EXPIRED: { label: 'Quá hạn', color: 'bg-purple-100 text-purple-700' },
    MAKEUP_CANCELLED: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-700' },
}

const allStatuses = [
    'MAKEUP_PENDING',
    'MAKEUP_REQUIRED',
    'MAKEUP_SCHEDULED',
    'MAKEUP_COMPLETED',
    'MAKEUP_ABSENT',
    'MAKEUP_EXPIRED',
    'MAKEUP_CANCELLED',
]
const historyStatuses = ['MAKEUP_COMPLETED', 'MAKEUP_ABSENT', 'MAKEUP_EXPIRED', 'MAKEUP_CANCELLED']

export default function MakeupPage() {
    const [tab, setTab] = useState('overview') // 'overview' | 'all' | 'history'
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
            if (tab === 'overview' || tab === 'incomplete') {
                const params = new URLSearchParams()
                if (searchQuery) params.set('q', searchQuery)
                const res = await fetch(`/api/academic/makeup-sessions/incomplete?${params}`)
                const json = await res.json()
                setIncompleteCourses(json.items || json.courses || [])
            } else {
                const params = new URLSearchParams()
                if (statusFilter) {
                    params.set('status', statusFilter)
                } else if (tab === 'history') {
                    params.set('scope', 'history')
                } else {
                    params.set('scope', 'all')
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

    const isOverview = tab === 'overview' || tab === 'incomplete'
    const currentFilters = tab === 'history' ? historyStatuses : allStatuses

    return (
        <div className="flex flex-col gap-3 p-4 h-full">
            {/* Page Top Tabs */}
            <div className="flex gap-0 border-b border-[var(--border-color)]">
                <button
                    className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                        isOverview
                            ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    onClick={() => handleTabChange('overview')}
                >
                    Tổng quan
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                        tab === 'all'
                            ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    onClick={() => handleTabChange('all')}
                >
                    Danh sách tổng hợp
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                        tab === 'history'
                            ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    onClick={() => handleTabChange('history')}
                >
                    Lịch sử bù
                </button>
            </div>

            {/* Notification Toast */}
            {msg.text && (
                <div className={`px-3 py-2 rounded text-xs sm:text-sm flex justify-between items-center ${
                    msg.type === 'error'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                    <span className="flex items-center gap-2">
                        {msg.type === 'error' ? <Svg_Waring w={14} h={14} c="#b91c1c" /> : <Svg_Check w={14} h={14} c="#15803d" />}
                        <span>{msg.text}</span>
                    </span>
                    <button onClick={() => setMsg({ text: '', type: 'success' })} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer">
                        <Svg_Close w={12} h={12} c="currentColor" />
                    </button>
                </div>
            )}

            {/* Toolbar & Filter Bar */}
            <div className="flex items-center justify-between gap-2.5 flex-wrap">
                {/* Search & Status Filters */}
                <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
                    <div className="relative w-full sm:w-72">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={13} height={13} fill="var(--text-secondary)">
                            <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
                        </svg>
                        <input
                            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded bg-white text-xs md:text-sm outline-none text-gray-700"
                            placeholder={isOverview ? 'Tìm tên / mã khóa học...' : 'Tìm học sinh, khóa học, bài học...'}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {!isOverview && (
                        <div className="flex items-center gap-1.5 flex-wrap text-xs">
                            <button
                                onClick={() => setStatusFilter('')}
                                className={`px-3 py-1.5 rounded transition-colors cursor-pointer border font-medium ${
                                    statusFilter === ''
                                        ? 'bg-[var(--main_d)] text-white border-[var(--main_d)]'
                                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--main_d)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                Tất cả
                            </button>
                            {currentFilters.map(f => (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f)}
                                    className={`px-3 py-1.5 rounded transition-colors cursor-pointer border font-medium ${
                                        statusFilter === f
                                            ? 'bg-[var(--main_d)] text-white border-[var(--main_d)]'
                                            : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--main_d)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    {statusMap[f]?.label || f}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { fetchSessions(); fetchStats(); }}
                        className="px-3 py-1.5 border border-[var(--border-color)] bg-[var(--bg-primary)] rounded text-xs text-[var(--text-primary)] hover:bg-[var(--hover)] transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                        title="Tải lại dữ liệu"
                    >
                        <Svg_Reload w="13" h="13" c="currentColor" />
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
                        className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--main_d)] hover:bg-[var(--main_b)] text-white transition-colors flex items-center gap-1.5 cursor-pointer border-none shadow-xs"
                    >
                        <Svg_Add w="13" h="13" c="white" />
                        <span>Tạo ca học bù</span>
                    </button>
                </div>
            </div>

            {/* Table Area */}
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 gap-2 text-[var(--text-secondary)]">
                    <p className="text-sm">Đang tải dữ liệu học bù...</p>
                </div>
            ) : isOverview ? (
                /* Tab 1: Tổng quan - Grouped Class Table */
                <div className="overflow-x-auto bg-[var(--bg-primary)] rounded border border-[var(--border-color)] flex-1">
                    <table className="w-full text-sm table-fixed min-w-[950px]">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[var(--main_d)] text-white">
                                <th className="p-2.5 font-medium w-[22%] text-left">Khóa học / Học sinh</th>
                                <th className="p-2.5 font-medium w-[18%] text-left">Giáo trình</th>
                                <th className="p-2.5 font-medium w-[32%] text-left">Chủ đề cần bù</th>
                                <th className="p-2.5 font-medium w-[14%] text-center">Số buổi thiếu</th>
                                <th className="p-2.5 font-medium w-[14%] text-center">Trạng thái lớp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {incompleteCourses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-sm text-[var(--text-secondary)] italic">
                                        Tuyệt vời! Không có lớp học nào có học sinh bị thiếu buổi cần bù.
                                    </td>
                                </tr>
                            ) : (
                                incompleteCourses.map(c => {
                                    const cid = c.course?._id || c.courseId
                                    const courseIdStr = c.course?.ID || c.courseName || ''
                                    const courseName = c.course?.Name || c.courseName || 'Khóa học'
                                    const totalMissingInCourse = c.students.reduce((sum, s) => sum + s.missingLessons, 0)
                                    const isExpanded = expandedCourses[cid]

                                    return (
                                        <React.Fragment key={cid}>
                                            {/* Course Group Header */}
                                            <tr
                                                onClick={() => toggleCourse(cid)}
                                                className="border-t border-[var(--border-color)] bg-[var(--main_d)]/5 hover:bg-[var(--main_d)]/10 transition-colors cursor-pointer select-none"
                                            >
                                                <td colSpan={5} className="p-2.5">
                                                    <div className="flex items-center gap-2.5 flex-wrap">
                                                        <div className="flex items-center gap-2 text-[var(--main_d)] font-semibold text-sm">
                                                            <svg
                                                                className={`shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                                                                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" height={10} width={10} fill="currentColor"
                                                            >
                                                                <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
                                                            </svg>
                                                            <Link
                                                                href={`/course/${c.course?.ID || c.course?._id || c.courseName}`}
                                                                onClick={e => e.stopPropagation()}
                                                                className="px-2 py-0.5 rounded-md text-xs font-semibold text-[var(--main_d)] bg-[var(--main_d)]/10 hover:bg-[var(--main_d)]/20 transition-colors"
                                                            >
                                                                {courseName} ({courseIdStr})
                                                            </Link>
                                                        </div>

                                                        {c.bookName && c.bookName !== 'N/A' && (
                                                            <span className="text-xs text-[var(--text-secondary)]">
                                                                Giáo trình: <span className="font-medium text-[var(--text-primary)]">{c.bookName}</span>
                                                            </span>
                                                        )}

                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                            c.isOngoing || (!c.isCompletedUnder4Weeks && !c.course?.Status)
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {c.statusText || (c.course?.Status ? 'Đã hoàn thành (< 4 tuần)' : 'Đang diễn ra')}
                                                        </span>

                                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                                            Thiếu: {totalMissingInCourse} buổi ({c.students.length} học sinh)
                                                        </span>

                                                        <span className="ml-auto text-xs text-[var(--text-secondary)] font-normal">
                                                            {c.students.length} học sinh
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Sub-rows for Students in Course */}
                                            {isExpanded && c.students.map(st => {
                                                const key = `${cid}-${st.studentId}`
                                                const isStudentExpanded = expandedStudents[key]

                                                return (
                                                    <React.Fragment key={st.studentId}>
                                                        <tr className="border-t border-[var(--border-color)] hover:bg-[var(--hover)] transition-colors">
                                                            <td className="p-2.5 pl-8 text-left">
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        onClick={() => toggleStudent(key)}
                                                                        className="cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                                                        title={isStudentExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết ngày/giờ'}
                                                                    >
                                                                        <svg
                                                                            className={`shrink-0 transition-transform duration-150 ${isStudentExpanded ? 'rotate-90' : ''}`}
                                                                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" height={9} width={9} fill="currentColor"
                                                                        >
                                                                            <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
                                                                        </svg>
                                                                    </span>
                                                                    <span className="font-mono text-xs text-[var(--text-secondary)]">[{st.studentId}]</span>
                                                                    <Link href={`/${st.studentId}`} className="text-[var(--main_d)] hover:underline font-semibold text-sm">
                                                                        {st.studentName}
                                                                    </Link>
                                                                </div>
                                                            </td>
                                                            <td className="p-2.5 text-left text-xs text-[var(--text-secondary)] truncate">
                                                                {c.bookName || '—'}
                                                            </td>
                                                            <td className="p-2.5 text-left">
                                                                <div className="flex flex-wrap gap-1.5 items-center">
                                                                    {st.missingDetail.map(d => (
                                                                        <span
                                                                            key={d.lessonId}
                                                                            className="px-2 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200 font-medium inline-flex items-center gap-1"
                                                                            title={d.Day ? `Ngày học: ${new Date(d.Day).toLocaleDateString('vi-VN')} (${d.Time || '—'})` : ''}
                                                                        >
                                                                            <span>{d.Topic?.Name || d.Topic || 'Chủ đề bài học'}</span>
                                                                            {d.Day && (
                                                                                <span className="text-[10px] text-orange-500 font-normal">
                                                                                    ({new Date(d.Day).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="p-2.5 text-center whitespace-nowrap">
                                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                                                    Thiếu {st.missingLessons}/{st.pastLessons || st.totalLessons} buổi
                                                                </span>
                                                            </td>
                                                            <td className="p-2.5 text-center text-xs">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                                    c.isOngoing || (!c.isCompletedUnder4Weeks && !c.course?.Status)
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                    {c.statusText || (c.course?.Status ? 'Đã hoàn thành (< 4 tuần)' : 'Đang diễn ra')}
                                                                </span>
                                                            </td>
                                                        </tr>

                                                        {/* Missing Lessons Detailed Table */}
                                                        {isStudentExpanded && (
                                                            <tr className="bg-gray-50/70 border-t border-[var(--border-color)]">
                                                                <td colSpan={5} className="p-3 pl-14">
                                                                    <div className="bg-white rounded border border-[var(--border-color)] overflow-hidden">
                                                                        <table className="w-full text-xs text-left">
                                                                            <thead>
                                                                                <tr className="bg-[var(--main_d)]/10 text-[var(--main_d)] font-semibold border-b border-[var(--border-color)]">
                                                                                    <th className="p-2 w-[25%]">Ngày học</th>
                                                                                    <th className="p-2 w-[25%]">Khung giờ</th>
                                                                                    <th className="p-2 w-[50%]">Chủ đề bài học cần bù</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-[var(--border-color)]">
                                                                                {st.missingDetail.map(d => (
                                                                                    <tr key={d.lessonId} className="hover:bg-[var(--hover)] transition-colors">
                                                                                        <td className="p-2 font-medium text-[var(--text-primary)]">
                                                                                            {d.Day ? new Date(d.Day).toLocaleDateString('vi-VN') : '—'}
                                                                                        </td>
                                                                                        <td className="p-2 text-[var(--text-secondary)] font-mono">
                                                                                            {d.Time || '—'}
                                                                                        </td>
                                                                                        <td className="p-2 font-medium text-[var(--text-primary)]">
                                                                                            {d.Topic?.Name || d.Topic || 'Chủ đề bài học'}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                )
                                            })}
                                        </React.Fragment>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Tab 2 & 3: Cần bù & Lịch sử bù - Standard Flat Table */
                <div className="overflow-x-auto bg-[var(--bg-primary)] rounded border border-[var(--border-color)] flex-1">
                    <table className="w-full text-sm min-w-[950px]">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[var(--main_d)] text-white">
                                <th className="p-2.5 font-medium w-[20%] text-left">Học sinh</th>
                                <th className="p-2.5 font-medium w-[18%] text-left">Khóa học</th>
                                <th className="p-2.5 font-medium w-[22%] text-left">Nội dung cần bù</th>
                                <th className="p-2.5 font-medium w-[16%] text-center">Lịch học bù</th>
                                <th className="p-2.5 font-medium w-[12%] text-center">Trạng thái</th>
                                <th className="p-2.5 font-medium w-[12%] text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {filteredSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-sm text-[var(--text-secondary)] italic">
                                        Không có ca học bù nào phù hợp với bộ lọc.
                                    </td>
                                </tr>
                            ) : (
                                filteredSessions.map(s => {
                                    const st = statusMap[s.makeupStatus] || { label: s.makeupStatus, color: 'bg-gray-100 text-gray-700' }

                                    return (
                                        <tr key={s._id} className="hover:bg-[var(--hover)] transition-colors border-t border-[var(--border-color)]">
                                            {/* Học sinh */}
                                            <td className="p-2.5 text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-[var(--text-secondary)]">[{s.studentId}]</span>
                                                    <Link href={`/${s.studentId}`} className="font-semibold text-sm text-[var(--main_d)] hover:underline">
                                                        {s.studentName}
                                                    </Link>
                                                </div>
                                            </td>

                                            {/* Khóa học */}
                                            <td className="p-2.5 text-left">
                                                {s.course ? (
                                                    <Link
                                                        href={`/course/${s.course.ID || s.course._id}`}
                                                        className="font-semibold text-sm text-[var(--main_d)] hover:underline"
                                                    >
                                                        {s.course.ID || s.course.Name || '—'}
                                                    </Link>
                                                ) : (
                                                    <span className="font-medium text-[var(--text-secondary)] text-sm">—</span>
                                                )}
                                                {s.isTeacherCreated && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-medium inline-block mt-0.5">
                                                        Giáo viên tạo
                                                    </span>
                                                )}
                                            </td>

                                            {/* Nội dung */}
                                            <td className="p-2.5 text-left">
                                                <span className="text-[var(--text-primary)] text-sm font-medium">{s.contentToMakeup || '—'}</span>
                                                {s.note && (
                                                    <div className="text-xs text-[var(--text-secondary)] italic mt-0.5">
                                                        Ghi chú: {s.note}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Lịch bù */}
                                            <td className="p-2.5 text-center whitespace-nowrap">
                                                {s.makeupDate ? (
                                                    <div className="flex flex-col items-center gap-0.5 text-xs">
                                                        <span className="font-semibold text-[var(--text-primary)]">
                                                            {new Date(s.makeupDate).toLocaleDateString('vi-VN')}
                                                        </span>
                                                        <span className="text-[var(--text-secondary)] font-mono">
                                                            {s.makeupTime || '—'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-[var(--text-secondary)] italic">Chưa xếp lịch</span>
                                                )}
                                            </td>

                                            {/* Trạng thái */}
                                            <td className="p-2.5 text-center whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium inline-block ${st.color}`}>
                                                    {st.label}
                                                </span>
                                            </td>

                                            {/* Thao tác */}
                                            <td className="p-2.5 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                    {s.makeupStatus === 'MAKEUP_PENDING' && (
                                                        <button
                                                            onClick={() => handleStatusChange(s._id, 'MAKEUP_SCHEDULED')}
                                                            className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors border-none cursor-pointer"
                                                        >
                                                            Xếp lịch
                                                        </button>
                                                    )}
                                                    {s.makeupStatus === 'MAKEUP_SCHEDULED' && (
                                                        <button
                                                            onClick={() => handleStatusChange(s._id, 'MAKEUP_COMPLETED')}
                                                            className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors border-none cursor-pointer"
                                                        >
                                                            Đã học bù
                                                        </button>
                                                    )}
                                                    {['MAKEUP_PENDING', 'MAKEUP_SCHEDULED'].includes(s.makeupStatus) && (
                                                        <button
                                                            onClick={() => handleStatusChange(s._id, 'MAKEUP_CANCELLED')}
                                                            className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors border-none cursor-pointer"
                                                        >
                                                            Hủy
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(s._id)}
                                                        className="p-1 rounded hover:bg-red-50 text-[var(--text-secondary)] hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer"
                                                        title="Xóa yêu cầu"
                                                    >
                                                        <Svg_Delete w="13" h="13" c="currentColor" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Tạo Yêu Cầu Học Bù Riêng */}
            <CenterPopup open={showForm} onClose={() => setShowForm(false)} size="md">
                <Title content="Tạo ca học bù riêng" click={() => setShowForm(false)} />
                <form onSubmit={handleCreate} className="p-4 flex flex-col gap-3 max-h-[calc(90vh-100px)] overflow-y-auto text-xs sm:text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Khóa học */}
                        <div className="flex flex-col gap-1">
                            <label className="font-semibold text-[var(--text-primary)]">Khóa học <span className="text-red-500">*</span></label>
                            <select
                                className="p-2 border border-gray-200 rounded text-xs sm:text-sm outline-none bg-white text-gray-700"
                                value={formData.courseId}
                                onChange={e => setFormData(f => ({ ...f, courseId: e.target.value }))}
                                required
                            >
                                <option value="">-- Chọn khóa học --</option>
                                {options.courses.map(c => (
                                    <option key={c._id} value={c._id}>
                                        {c.ID} {c.Status ? '(Đã hoàn thành < 4 tuần)' : '(Đang diễn ra)'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Mã học sinh */}
                        <div className="flex flex-col gap-1">
                            <label className="font-semibold text-[var(--text-primary)]">Mã học sinh <span className="text-red-500">*</span></label>
                            <input
                                className="p-2 border border-gray-200 rounded text-xs sm:text-sm outline-none bg-white text-gray-700"
                                placeholder="Ví dụ: HS00124"
                                value={formData.studentId}
                                onChange={e => setFormData(f => ({ ...f, studentId: e.target.value }))}
                                required
                            />
                        </div>

                        {/* Giáo viên phụ trách */}
                        <div className="flex flex-col gap-1">
                            <label className="font-semibold text-[var(--text-primary)]">Giáo viên phụ trách</label>
                            <select
                                className="p-2 border border-gray-200 rounded text-xs sm:text-sm outline-none bg-white text-gray-700"
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
                            <label className="font-semibold text-[var(--text-primary)]">Phòng học</label>
                            <select
                                className="p-2 border border-gray-200 rounded text-xs sm:text-sm outline-none bg-white text-gray-700"
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
                            <label className="font-semibold text-[var(--text-primary)]">Ngày học bù</label>
                            <DateInput
                                className="p-2 border border-gray-200 rounded text-xs sm:text-sm outline-none bg-white text-gray-700"
                                placeholder="Chọn ngày học bù"
                                value={formData.makeupDate}
                                onChange={v => setFormData(f => ({ ...f, makeupDate: v }))}
                            />
                        </div>

                        {/* Khung giờ học */}
                        <div className="flex flex-col gap-1">
                            <label className="font-semibold text-[var(--text-primary)]">Khung giờ</label>
                            <input
                                className="p-2 border border-gray-200 rounded text-xs sm:text-sm outline-none bg-white text-gray-700"
                                placeholder="Ví dụ: 18:00 - 19:30"
                                value={formData.makeupTime}
                                onChange={e => setFormData(f => ({ ...f, makeupTime: e.target.value }))}
                            />
                        </div>

                        {/* Nội dung cần bù */}
                        <div className="flex flex-col gap-1 sm:col-span-2">
                            <label className="font-semibold text-[var(--text-primary)]">Nội dung / Chủ đề cần bù</label>
                            <input
                                className="p-2 border border-gray-200 rounded text-xs sm:text-sm outline-none bg-white text-gray-700"
                                placeholder="Ví dụ: Bù bài Chủ đề 4: Lắp ráp xe dò đường"
                                value={formData.contentToMakeup}
                                onChange={e => setFormData(f => ({ ...f, contentToMakeup: e.target.value }))}
                            />
                        </div>

                        {/* Ghi chú */}
                        <div className="flex flex-col gap-1 sm:col-span-2">
                            <label className="font-semibold text-[var(--text-primary)]">Ghi chú thêm</label>
                            <textarea
                                rows={2}
                                className="p-2 border border-gray-200 rounded text-xs sm:text-sm outline-none bg-white text-gray-700 resize-none"
                                placeholder="Ghi chú thêm cho giáo viên hoặc phụ huynh..."
                                value={formData.note}
                                onChange={e => setFormData(f => ({ ...f, note: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)] mt-2">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 border border-[var(--border-color)] rounded text-xs sm:text-sm font-medium cursor-pointer hover:bg-gray-50 bg-white"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-[var(--main_d)] hover:bg-[var(--main_b)] rounded text-xs sm:text-sm font-medium text-white cursor-pointer border-none disabled:opacity-50 flex items-center gap-1.5"
                        >
                            {saving ? 'Đang lưu...' : 'Xác nhận tạo ca bù'}
                        </button>
                    </div>
                </form>
            </CenterPopup>
        </div>
    )
}
