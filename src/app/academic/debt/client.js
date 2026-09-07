'use client'

import { useState, useMemo } from 'react'
import React from 'react'
import Link from 'next/link'
import DateInput from '@/components/(ui)/(input)/DateInput'
import Pay from '@/app/student/list/ui/pay'
import BankManager from '@/components/bank-manager'
import CenterPopup from '@/components/(features)/(popup)/popup_center'

function getCourseId(courseRef) {
    if (!courseRef) return ''
    if (typeof courseRef === 'object') {
        if (courseRef.ID) return String(courseRef.ID)
        if (courseRef._id) return String(courseRef._id)
        return ''
    }
    return String(courseRef)
}

function fmtPrice(price) {
    const n = Number(price)
    if (!n || isNaN(n)) return '—'
    return n.toLocaleString('vi-VN') + ' VNĐ'
}

export default function DebtClient({ students, courseMap, attendanceMap, debts }) {
    const [search, setSearch] = useState('')
    const [viewMode, setViewMode] = useState('grouped')
    const [expanded, setExpanded] = useState({})
    const [allExpanded, setAllExpanded] = useState(true)
    const [tab, setTab] = useState('tuition')
    const [phaseTab, setPhaseTab] = useState('ongoing') // 'ongoing' | 'all'
    const [showCreatePopup, setShowCreatePopup] = useState(false)
    const [createStudent, setCreateStudent] = useState(null)
    const [createMode, setCreateMode] = useState('course')
    const [createSearch, setCreateSearch] = useState('')
    const [manualName, setManualName] = useState('')
    const [manualAmount, setManualAmount] = useState('')
    const [manualSessions, setManualSessions] = useState('')
    const [manualStartDate, setManualStartDate] = useState('')
    const [manualEndDate, setManualEndDate] = useState('')
    const [manualNote, setManualNote] = useState('')
    const [saving, setSaving] = useState(false)
    const [showFilter, setShowFilter] = useState(false)
    const [filterOpts, setFilterOpts] = useState({
        unpaid: true,
        paid: true,
        fullAttended: true,
        incomplete: true,
        completed: false,
    })
    const reloadPage = async () => {
        try { await fetch('/api/clear-cache', { method: 'POST' }) } catch { }
        window.location.href = '/academic/debt?' + Date.now()
    }
    const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000
    const fullAttended = (r) => r.totalLessons > 0 && r.attended >= r.totalLessons
    const isCourseEnded = (r) => Boolean((r.endDate && new Date(r.endDate) < new Date()) || (r.totalLessons > 0 && r.attended >= r.totalLessons))
    const isEndedWithin4Weeks = (r, now = new Date()) => {
        if (!r.endDate) return true
        const end = new Date(r.endDate)
        const diff = now.getTime() - end.getTime()
        return diff >= 0 && diff <= FOUR_WEEKS_MS
    }
    const isCompleted = isCourseEnded

    const rows = useMemo(() => {
        const result = []
        const seen = new Set()
        const debtMap = {}
            ; (debts || []).forEach(d => {
                const sid = String(d.studentId)
                if (!debtMap[sid]) debtMap[sid] = []
                debtMap[sid].push(d)
            })
        students.forEach(s => {
            ; (s.Course || []).forEach(c => {
                if (!c || !c.course) return
                const cid = getCourseId(c.course)
                if (!cid || cid === '[object Object]') return
                const key = s._id + '-' + cid
                if (seen.has(key)) return
                seen.add(key)
                const cObj = typeof c.course === 'object' ? c.course : null
                const cName = courseMap[cid]?.name || cObj?.ID || cObj?.Name || (cid.length > 10 ? cid.slice(-6) : cid)
                result.push({
                    _id: s._id,
                    ID: s.ID,
                    Name: s.Name,
                    Phone: s.Phone,
                    AreaName: s.Area?.name || '-',
                    courseId: cid,
                    courseName: cName,
                    price: courseMap[cid]?.price ?? cObj?.Book?.Price ?? 0,
                    startDate: courseMap[cid]?.startDate,
                    endDate: courseMap[cid]?.endDate,
                    status: c.status,
                    paid: c.tuition != null,
                    attended: attendanceMap?.[cid]?.[s.ID] || 0,
                    totalLessons: courseMap[cid]?.totalLessons || 0,
                    isDebt: false,
                })
            })
            const sd = debtMap[s._id] || []
            sd.forEach(d => {
                result.push({
                    _id: s._id,
                    ID: s.ID,
                    Name: s.Name,
                    Phone: s.Phone,
                    AreaName: s.Area?.name || '-',
                    courseId: d._id ? String(d._id) : '',
                    courseName: d.courseName || 'Khoản nợ',
                    price: d.amount || 0,
                    startDate: d.startDate || '',
                    endDate: d.endDate || '',
                    status: d.status,
                    paid: false,
                    attended: d.sessions || 0,
                    totalLessons: d.sessions || 0,
                    isDebt: true,
                })
            })
        })
        result.sort((a, b) => (a.courseName || '').localeCompare(b.courseName || ''))
        return result
    }, [students, courseMap, attendanceMap, debts])

    // Xác định trạng thái nợ & kết thúc của từng lớp học
    const courseStatusMap = useMemo(() => {
        const map = {}
        const now = new Date()
        rows.forEach(r => {
            const cid = r.courseId || r._id
            if (!map[cid]) {
                map[cid] = {
                    hasUnpaid: false,
                    isEnded: isCourseEnded(r),
                    endedWithin4Weeks: isEndedWithin4Weeks(r, now),
                }
            }
            if (!r.paid) {
                map[cid].hasUnpaid = true
            }
        })
        return map
    }, [rows])

    const isRowInOngoing = (r) => {
        const cid = r.courseId || r._id
        const cStatus = courseStatusMap[cid]
        if (!cStatus) return true
        // Nếu lớp đang diễn ra -> hiển thị
        if (!cStatus.isEnded) return true
        // Nếu lớp đã kết thúc nhưng chưa hoàn thành học phí cả lớp và kết thúc trong vòng 4 tuần -> vẫn hiển thị
        return cStatus.hasUnpaid && cStatus.endedWithin4Weeks
    }

    const ongoingCount = useMemo(() => rows.filter(isRowInOngoing).length, [rows, courseStatusMap])
    const allCount = rows.length

    const phaseRows = useMemo(() => {
        if (phaseTab === 'ongoing') return rows.filter(isRowInOngoing)
        return rows
    }, [rows, phaseTab, courseStatusMap])

    const phaseUnpaid = useMemo(() => phaseRows.filter(r => !r.paid), [phaseRows])
    const phasePaid = useMemo(() => phaseRows.filter(r => r.paid), [phaseRows])
    const phaseUnpaidSum = useMemo(() => phaseUnpaid.reduce((sum, r) => sum + (Number(r.price) || 0), 0), [phaseUnpaid])

    const filtered = useMemo(() => {
        let result = phaseRows
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(r =>
                r.ID?.toLowerCase().includes(q) ||
                r.Name?.toLowerCase().includes(q) ||
                r.Phone?.toLowerCase().includes(q) ||
                r.courseName?.toLowerCase().includes(q)
            )
        }
        result = result.filter(r => {
            if (filterOpts.completed && !isCourseEnded(r)) return false
            const full = fullAttended(r)
            const paid = r.paid
            if (paid && !filterOpts.paid) return false
            if (!paid && !filterOpts.unpaid) return false
            if (full && !filterOpts.fullAttended) return false
            if (!full && !filterOpts.incomplete) return false
            return true
        })
        return result
    }, [phaseRows, search, filterOpts])

    const grouped = useMemo(() => {
        const map = {}
        filtered.forEach(r => {
            if (!map[r.courseId]) map[r.courseId] = []
            map[r.courseId].push(r)
        })
        return Object.entries(map).sort((a, b) =>
            (a[1][0].courseName || '').localeCompare(b[1][0].courseName || '')
        )
    }, [filtered])

    function renderFlat() {
        return (
            <div className="overflow-x-auto bg-[var(--bg-primary)] rounded border border-[var(--border-color)] flex-1">
                <table className="w-full text-sm table-fixed min-w-[950px]">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-[var(--main_d)] text-white">
                            <th className="p-2.5 font-medium w-[12%] text-left">Lớp</th>
                            <th className="p-2.5 font-medium w-[9%] text-center">Ngày BĐ</th>
                            <th className="p-2.5 font-medium w-[9%] text-center">Ngày KT</th>
                            <th className="p-2.5 font-medium w-[8%] text-center">ID</th>
                            <th className="p-2.5 font-medium w-[18%] text-left">Tên</th>
                            <th className="p-2.5 font-medium w-[11%] text-center">Điện thoại</th>
                            <th className="p-2.5 font-medium w-[7%] text-center">Buổi</th>
                            <th className="p-2.5 font-medium w-[12%] text-right pr-4">Số tiền</th>
                            <th className="p-2.5 font-medium w-[8%] text-center">Đóng tiền</th>
                            <th className="p-2.5 font-medium w-[6%] text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(r => (
                            <tr key={r._id + '-' + r.courseId} className="border-t border-[var(--border-color)] hover:bg-[var(--hover)] transition-colors">
                                <td className="p-2.5 whitespace-nowrap text-left">
                                    {r.isDebt || !r.courseId || r.courseId === '[object Object]' ? (
                                        <span className="inline-block max-w-full truncate px-2 py-0.5 rounded-md text-xs font-medium text-[var(--text-primary)]" title={r.courseName}>{r.courseName}</span>
                                    ) : (
                                        <Link href={`/course/${r.courseId}`} className="inline-block max-w-full truncate px-2 py-0.5 rounded-md text-xs font-medium text-[var(--main_d)] bg-[var(--main_d)]/10 hover:bg-[var(--main_d)]/20 transition-colors" title={r.courseName}>{r.courseName}</Link>
                                    )}
                                </td>
                                <td className="p-2.5 text-[var(--text-primary)] text-xs whitespace-nowrap text-center">{r.startDate ? new Date(r.startDate).toLocaleDateString('vi-VN') : '—'}</td>
                                <td className="p-2.5 text-[var(--text-primary)] text-xs whitespace-nowrap text-center">{r.endDate ? new Date(r.endDate).toLocaleDateString('vi-VN') : '—'}</td>
                                <td className="p-2.5 text-[var(--text-primary)] font-mono text-xs whitespace-nowrap text-center">{r.ID}</td>
                                <td className="p-2.5 font-medium truncate text-left">
                                    <Link href={`/${r._id}`} className="text-[var(--main_d)] hover:underline" title={r.Name}>{r.Name}</Link>
                                </td>
                                <td className="p-2.5 text-[var(--text-secondary)] whitespace-nowrap text-center text-xs">{r.Phone || '—'}</td>
                                <td className="p-2.5 whitespace-nowrap text-center">
                                    <span className={`font-medium ${r.totalLessons > 0 && r.attended >= r.totalLessons ? 'text-green-600' : 'text-red-600'}`}>{r.attended}/{r.totalLessons}</span>
                                </td>
                                <td className="p-2.5 whitespace-nowrap font-medium text-right pr-4">{r.isDebt ? fmtPrice(Number(r.price)) : fmtPrice(r.price)}</td>
                                <td className="p-2.5 whitespace-nowrap text-center">
                                    {r.paid ? (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Đã đóng</span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Chưa đóng</span>
                                    )}
                                </td>
                                <td className="p-2.5 whitespace-nowrap text-center">
                                    <Pay _id={r._id} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    const toggleAll = () => {
        if (allExpanded) {
            const newExp = {}
            grouped.forEach(([cid]) => { newExp[cid] = false })
            setExpanded(newExp)
            setAllExpanded(false)
        } else {
            setExpanded({})
            setAllExpanded(true)
        }
    }

    function renderGrouped() {
        return (
            <div className="overflow-x-auto bg-[var(--bg-primary)] rounded border border-[var(--border-color)] flex-1">
                <table className="w-full text-sm table-fixed min-w-[950px]">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-[var(--main_d)] text-white">
                            <th className="p-2.5 font-medium w-[8%] text-center">ID</th>
                            <th className="p-2.5 font-medium w-[22%] text-left">Họ và tên</th>
                            <th className="p-2.5 font-medium w-[12%] text-center">Điện thoại</th>
                            <th className="p-2.5 font-medium w-[12%] text-center">Khu vực</th>
                            <th className="p-2.5 font-medium w-[10%] text-center">Số buổi</th>
                            <th className="p-2.5 font-medium w-[14%] text-right pr-4">Học phí</th>
                            <th className="p-2.5 font-medium w-[12%] text-center">Đóng tiền</th>
                            <th className="p-2.5 font-medium w-[10%] text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grouped.map(([cid, list]) => {
                            const first = list[0]
                            const courseName = first?.courseName || 'Khóa học'
                            const open = expanded[cid] !== false
                            const isDebtGroup = first?.isDebt || !cid || cid === '[object Object]'
                            const ended = isCourseEnded(first)
                            const unpaidInGroup = list.filter(r => !r.paid).length
                            const totalDebtInGroup = list.filter(r => !r.paid).reduce((sum, r) => sum + (Number(r.price) || 0), 0)

                            return (
                                <React.Fragment key={cid}>
                                    {/* Class Group Header */}
                                    <tr
                                        onClick={() => setExpanded(p => ({ ...p, [cid]: !open }))}
                                        className="border-t border-[var(--border-color)] bg-[var(--main_d)]/5 hover:bg-[var(--main_d)]/10 transition-colors cursor-pointer select-none"
                                    >
                                        <td colSpan={8} className="p-2.5">
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <div className="flex items-center gap-2 text-[var(--main_d)] font-semibold text-sm">
                                                    <svg
                                                        className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
                                                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" height={10} width={10} fill="currentColor"
                                                    >
                                                        <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
                                                    </svg>
                                                    {isDebtGroup ? (
                                                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[var(--main_d)]/10">{courseName}</span>
                                                    ) : (
                                                        <Link
                                                            href={`/course/${cid}`}
                                                            onClick={e => e.stopPropagation()}
                                                            className="px-2 py-0.5 rounded-md text-xs font-semibold text-[var(--main_d)] bg-[var(--main_d)]/10 hover:bg-[var(--main_d)]/20 transition-colors"
                                                        >
                                                            {courseName}
                                                        </Link>
                                                    )}
                                                </div>

                                                {/* Dates */}
                                                {(first?.startDate || first?.endDate) && (
                                                    <span className="text-xs text-[var(--text-secondary)]">
                                                        ({first?.startDate ? new Date(first.startDate).toLocaleDateString('vi-VN') : '—'} → {first?.endDate ? new Date(first.endDate).toLocaleDateString('vi-VN') : '—'})
                                                    </span>
                                                )}

                                                {/* Phase Status Tag */}
                                                {ended ? (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                                        Đã kết thúc
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                                        Đang diễn ra
                                                    </span>
                                                )}

                                                {/* Debt Status Badge */}
                                                {unpaidInGroup > 0 ? (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                                        Chưa đóng: {unpaidInGroup} ({fmtPrice(totalDebtInGroup)})
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                                        Đã thu đủ
                                                    </span>
                                                )}

                                                <span className="ml-auto text-xs text-[var(--text-secondary)] font-normal">
                                                    {list.length} học sinh
                                                </span>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Student Rows inside Class */}
                                    {open && list.map(r => (
                                        <tr
                                            key={r._id + '-' + r.courseId}
                                            className="border-t border-[var(--border-color)] hover:bg-[var(--hover)] transition-colors"
                                        >
                                            <td className="p-2.5 text-[var(--text-primary)] font-mono text-xs whitespace-nowrap text-center">{r.ID}</td>
                                            <td className="p-2.5 font-medium truncate text-left">
                                                <Link href={`/${r._id}`} className="text-[var(--main_d)] hover:underline font-semibold" title={r.Name}>{r.Name}</Link>
                                            </td>
                                            <td className="p-2.5 text-[var(--text-secondary)] whitespace-nowrap text-center text-xs">{r.Phone || '—'}</td>
                                            <td className="p-2.5 text-[var(--text-secondary)] whitespace-nowrap text-center text-xs truncate">{r.AreaName || '—'}</td>
                                            <td className="p-2.5 whitespace-nowrap text-center">
                                                <span className={`font-medium ${r.totalLessons > 0 && r.attended >= r.totalLessons ? 'text-green-600' : 'text-red-600'}`}>
                                                    {r.attended}/{r.totalLessons}
                                                </span>
                                            </td>
                                            <td className="p-2.5 whitespace-nowrap font-medium text-right pr-4">{fmtPrice(r.price)}</td>
                                            <td className="p-2.5 whitespace-nowrap text-center">
                                                {r.paid ? (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Đã đóng</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Chưa đóng</span>
                                                )}
                                            </td>
                                            <td className="p-2.5 whitespace-nowrap text-center">
                                                <Pay _id={r._id} />
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3 p-4 h-full">

            <div className="flex gap-0 border-b border-[var(--border-color)]">
                <button
                    className={`px-4 py-2 text-sm font-medium transition-colors ${tab === 'tuition' ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    onClick={() => setTab('tuition')}
                >
                    Danh sách
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium transition-colors ${tab === 'bank' ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    onClick={() => setTab('bank')}
                >
                    Ngân hàng
                </button>
            </div>

            {tab === 'tuition' ? (
                <>
                    {/* Phase Tabs & Toolbar */}
                    <div className="flex flex-col gap-2.5">
                        {/* Phase Tabs */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                <button
                                    onClick={() => setPhaseTab('ongoing')}
                                    className={`px-3 py-1.5 rounded transition-colors cursor-pointer border font-medium ${
                                        phaseTab === 'ongoing'
                                            ? 'bg-[var(--main_d)] text-white border-[var(--main_d)]'
                                            : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--main_d)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    Lớp đang diễn ra ({ongoingCount})
                                </button>
                                <button
                                    onClick={() => setPhaseTab('all')}
                                    className={`px-3 py-1.5 rounded transition-colors cursor-pointer border font-medium ${
                                        phaseTab === 'all'
                                            ? 'bg-[var(--main_d)] text-white border-[var(--main_d)]'
                                            : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--main_d)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    Danh sách tổng hợp ({allCount})
                                </button>
                            </div>

                            {/* Unpaid alert */}
                            {phaseUnpaid.length > 0 && (
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-[var(--text-secondary)]">Chưa thu:</span>
                                    <strong className="text-red-600">{phaseUnpaid.length} học sinh</strong>
                                    <span className="text-[var(--text-secondary)]">•</span>
                                    <strong className="text-red-600">{fmtPrice(phaseUnpaidSum)}</strong>
                                </div>
                            )}
                        </div>

                        {/* Search & Actions Row */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Search bar */}
                            <div className="relative flex-1 min-w-[200px]">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={13} height={13} fill="currentColor">
                                        <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
                                    </svg>
                                </span>
                                <input
                                    className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 focus:border-[var(--main_d)] transition-colors"
                                    placeholder="Tìm theo tên học sinh, mã HV, SĐT, lớp..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0 text-xs"
                                        title="Xóa tìm kiếm"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Advanced Filter Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowFilter(!showFilter)}
                                    className={`px-3 py-2 text-xs rounded border transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                        showFilter || !filterOpts.unpaid || !filterOpts.paid || !filterOpts.fullAttended || !filterOpts.incomplete || filterOpts.completed
                                            ? 'border-[var(--main_d)] text-[var(--main_d)] bg-[var(--main_d)]/5 font-medium'
                                            : 'border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--main_d)]'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={12} height={12} fill="currentColor">
                                        <path d="M3.9 54.9C10.5 40.9 24.5 32 40 32l432 0c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9 320 448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6l0-79.1L9 97.5C-.7 85.4-2.8 68.8 3.9 54.9z" />
                                    </svg>
                                    Bộ lọc
                                    {(!filterOpts.unpaid || !filterOpts.paid || !filterOpts.fullAttended || !filterOpts.incomplete || filterOpts.completed) && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--main_d)]"></span>
                                    )}
                                </button>
                                {showFilter && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                                        <div className="absolute z-20 top-full mt-1 right-0 bg-white border border-gray-200 rounded shadow-lg py-1.5 min-w-[200px]">
                                            <div className="flex items-center justify-between px-3 py-1 border-b border-gray-100 mb-1">
                                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tùy chọn lọc</span>
                                                <button
                                                    onClick={() => setFilterOpts({ unpaid: true, paid: true, fullAttended: true, incomplete: true, completed: false })}
                                                    className="text-[11px] text-[var(--main_d)] hover:underline bg-transparent border-none cursor-pointer"
                                                >
                                                    Đặt lại
                                                </button>
                                            </div>
                                            <p className="px-3 py-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Đóng tiền</p>
                                            <label className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer">
                                                <input type="checkbox" checked={filterOpts.unpaid} onChange={e => setFilterOpts(p => ({ ...p, unpaid: e.target.checked }))} className="accent-[var(--main_d)]" />
                                                Chưa đóng
                                            </label>
                                            <label className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer">
                                                <input type="checkbox" checked={filterOpts.paid} onChange={e => setFilterOpts(p => ({ ...p, paid: e.target.checked }))} className="accent-[var(--main_d)]" />
                                                Đã đóng
                                            </label>
                                            <div className="border-t border-gray-100 my-1" />
                                            <p className="px-3 py-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Số buổi</p>
                                            <label className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer">
                                                <input type="checkbox" checked={filterOpts.fullAttended} onChange={e => setFilterOpts(p => ({ ...p, fullAttended: e.target.checked }))} className="accent-[var(--main_d)]" />
                                                Đủ buổi
                                            </label>
                                            <label className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer">
                                                <input type="checkbox" checked={filterOpts.incomplete} onChange={e => setFilterOpts(p => ({ ...p, incomplete: e.target.checked }))} className="accent-[var(--main_d)]" />
                                                Chưa đủ buổi
                                            </label>
                                            <div className="border-t border-gray-100 my-1" />
                                            <label className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer">
                                                <input type="checkbox" checked={filterOpts.completed} onChange={e => setFilterOpts(p => ({ ...p, completed: e.target.checked }))} className="accent-[var(--main_d)]" />
                                                Đủ buổi (đã kết thúc)
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* View Mode Toggle */}
                            <button
                                onClick={() => setViewMode(v => v === 'flat' ? 'grouped' : 'flat')}
                                className="px-3 py-2 text-xs rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--main_d)] transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer font-medium"
                                title="Chuyển chế độ xem"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={12} height={12} fill="currentColor">
                                    <path d="M40 48C26.7 48 16 58.7 16 72l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24L40 48zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L192 64zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zM16 232l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0z"/>
                                </svg>
                                {viewMode === 'flat' ? 'Theo lớp' : 'Danh sách'}
                            </button>

                            {/* Expand/Collapse All (only in grouped view) */}
                            {viewMode === 'grouped' && (
                                <button
                                    onClick={toggleAll}
                                    className="px-3 py-2 text-xs rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--main_d)] transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer font-medium"
                                    title={allExpanded ? 'Thu gọn tất cả lớp' : 'Mở rộng tất cả lớp'}
                                >
                                    <svg
                                        className={`transition-transform duration-150 ${allExpanded ? 'rotate-180' : ''}`}
                                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={10} height={10} fill="currentColor"
                                    >
                                        <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z" />
                                    </svg>
                                    {allExpanded ? 'Thu gọn tất cả' : 'Mở tất cả'}
                                </button>
                            )}

                            {/* Reload Button */}
                            <button
                                onClick={() => reloadPage()}
                                className="px-3 py-2 text-xs rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--main_d)] transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer font-medium"
                                title="Tải lại dữ liệu"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={12} height={12} fill="currentColor">
                                    <path d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 336 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l128 0c0 0 0 0 0 0l.4 0c17.7 0 32-14.3 32-32l0-128c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 416c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c0 0 0 0 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.8c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352l34.4 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z" />
                                </svg>
                                Tải lại
                            </button>
                        </div>

                        {/* Quick filter pills */}
                        <div className="flex items-center gap-1.5 flex-wrap text-xs">
                            <span className="text-[var(--text-secondary)] font-medium mr-0.5">Lọc nhanh:</span>
                            <button
                                onClick={() => setFilterOpts({ unpaid: true, paid: true, fullAttended: true, incomplete: true, completed: false })}
                                className={`px-2.5 py-1 rounded transition-colors cursor-pointer border ${
                                    filterOpts.unpaid && filterOpts.paid && !filterOpts.completed
                                        ? 'bg-[var(--main_d)] text-white border-[var(--main_d)] font-medium'
                                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--main_d)]'
                                }`}
                            >
                                Tất cả ({phaseRows.length})
                            </button>
                            <button
                                onClick={() => setFilterOpts({ unpaid: true, paid: false, fullAttended: true, incomplete: true, completed: false })}
                                className={`px-2.5 py-1 rounded transition-colors cursor-pointer border ${
                                    filterOpts.unpaid && !filterOpts.paid
                                        ? 'bg-red-600 text-white border-red-600 font-medium'
                                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                }`}
                            >
                                Chưa đóng ({phaseUnpaid.length})
                            </button>
                            <button
                                onClick={() => setFilterOpts({ unpaid: false, paid: true, fullAttended: true, incomplete: true, completed: false })}
                                className={`px-2.5 py-1 rounded transition-colors cursor-pointer border ${
                                    !filterOpts.unpaid && filterOpts.paid
                                        ? 'bg-green-600 text-white border-green-600 font-medium'
                                        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                }`}
                            >
                                Đã đóng ({phasePaid.length})
                            </button>
                            {phaseTab === 'all' && (
                                <button
                                    onClick={() => setFilterOpts({ unpaid: true, paid: false, fullAttended: true, incomplete: true, completed: true })}
                                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer border ${
                                        filterOpts.completed && filterOpts.unpaid && !filterOpts.paid
                                            ? 'bg-amber-600 text-white border-amber-600 font-medium'
                                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                    }`}
                                >
                                    Đã kết thúc chưa đóng ({phaseRows.filter(r => !r.paid && isCourseEnded(r)).length})
                                </button>
                            )}
                            <span className="ml-auto text-[var(--text-secondary)] font-medium">
                                Hiển thị: <strong className="text-[var(--text-primary)]">{filtered.length}</strong> học sinh
                            </span>
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-secondary)] py-12">
                            Không có học sinh nợ học phí phù hợp
                        </div>
                    ) : viewMode === 'flat' ? renderFlat() : renderGrouped()}
                </>
            ) : (
                <BankManager />
            )}

            <CenterPopup open={showCreatePopup} onClose={() => { setShowCreatePopup(false); setCreateStudent(null); setCreateMode('course'); setCreateSearch(''); setManualName(''); setManualAmount(''); setManualSessions(''); setManualStartDate(''); setManualEndDate(''); setManualNote(''); }} title="Thêm học phí" size="md">
                <div className="p-4 flex flex-col gap-4">
                    {!createStudent ? (
                        <>
                            <input
                                className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700"
                                placeholder="Tìm học sinh theo tên hoặc ID..."
                                value={createSearch}
                                onChange={e => setCreateSearch(e.target.value)}
                            />
                            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                                {students.filter(s => {
                                    const q = createSearch.toLowerCase()
                                    return !q || s.Name?.toLowerCase().includes(q) || s.ID?.toLowerCase().includes(q)
                                }).map(s => (
                                    <button
                                        key={s._id}
                                        className="flex items-center gap-3 px-3 py-2 rounded text-sm text-left border border-[var(--border-color)] bg-white hover:bg-[var(--main_d)]/5 transition-colors cursor-pointer"
                                        onClick={() => setCreateStudent(s)}
                                    >
                                        <span className="font-semibold text-[var(--main_d)]">{s.ID}</span>
                                        <span className="text-[var(--text-primary)]">{s.Name}</span>
                                        <span className="text-xs text-[var(--text-secondary)] ml-auto">{s.Phone || '—'}</span>
                                    </button>
                                ))}
                                {createSearch && students.filter(s => s.Name?.toLowerCase().includes(createSearch.toLowerCase()) || s.ID?.toLowerCase().includes(createSearch.toLowerCase())).length === 0 && (
                                    <p className="text-sm text-[var(--text-secondary)] text-center py-4">Không tìm thấy học sinh</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 px-3 py-2 bg-[var(--main_d)]/5 rounded border border-[var(--main_d)]/20">
                                <span className="font-semibold text-[var(--main_d)] text-sm">{createStudent.ID}</span>
                                <span className="text-sm text-[var(--text-primary)]">{createStudent.Name}</span>
                                <button
                                    className="ml-auto text-xs text-[var(--text-secondary)] hover:text-[var(--main_d)] bg-transparent border-none cursor-pointer"
                                    onClick={() => { setCreateStudent(null); setCreateMode('course'); }}
                                >
                                    Đổi
                                </button>
                            </div>

                            <div className="flex border-b border-[var(--border-color)]">
                                <button
                                    className={`px-3 py-2 text-sm font-medium transition-colors ${createMode === 'course' ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)]'}`}
                                    onClick={() => setCreateMode('course')}
                                >
                                    Theo khóa học
                                </button>
                                <button
                                    className={`px-3 py-2 text-sm font-medium transition-colors ${createMode === 'manual' ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)]'}`}
                                    onClick={() => setCreateMode('manual')}
                                >
                                    Nhập tay
                                </button>
                            </div>

                            {createMode === 'course' ? (
                                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                                    {(createStudent.Course || []).filter(c => c.tuition == null).map(c => {
                                        const cid = String(c.course)
                                        const info = courseMap[cid]
                                        return (
                                            <button
                                                key={cid}
                                                className="flex items-center justify-between px-3 py-2 rounded text-sm border border-[var(--border-color)] bg-white hover:bg-[var(--main_d)]/5 transition-colors cursor-pointer"
                                                onClick={async () => {
                                                    setSaving(true)
                                                    try {
                                                        const res = await fetch('/api/debt', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                studentId: createStudent._id,
                                                                courseId: cid,
                                                                courseName: info?.name || cid.slice(-6),
                                                                amount: info?.price || 0,
                                                                note: '',
                                                                type: 'course',
                                                            }),
                                                        })
                                                        const result = await res.json()
                                                        if (res.ok) {
                                                            setShowCreatePopup(false)
                                                            setCreateStudent(null)
                                                            setCreateMode('course')
                                                            reloadPage()
                                                        } else {
                                                            alert(result.mes || 'Lỗi tạo học phí')
                                                        }
                                                    } catch (err) {
                                                        alert('Lỗi kết nối')
                                                    } finally {
                                                        setSaving(false)
                                                    }
                                                }}
                                                disabled={saving}
                                            >
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-medium text-[var(--text-primary)]">{info?.name || cid.slice(-6)}</span>
                                                    <span className="text-xs text-[var(--text-secondary)]">{info?.startDate ? new Date(info.startDate).toLocaleDateString('vi-VN') : '—'} → {info?.endDate ? new Date(info.endDate).toLocaleDateString('vi-VN') : '—'}</span>
                                                </div>
                                                <span className="text-sm font-semibold text-[var(--main_d)]">{info?.price ? (Number(info.price).toLocaleString('vi-VN') + ' VNĐ') : '—'}</span>
                                            </button>
                                        )
                                    })}
                                    {(createStudent.Course || []).filter(c => c.tuition == null).length === 0 && (
                                        <p className="text-sm text-[var(--text-secondary)] text-center py-4">Học sinh này đã đóng hết học phí</p>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Tên khóa học</label>
                                        <input
                                            className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700"
                                            placeholder="VD: Toán tư duy - Cơ bản"
                                            value={manualName}
                                            onChange={e => setManualName(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Số tiền</label>
                                            <input
                                                className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700"
                                                type="number"
                                                placeholder="0"
                                                value={manualAmount}
                                                onChange={e => setManualAmount(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Số buổi</label>
                                            <input
                                                className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700"
                                                type="number"
                                                placeholder="0"
                                                value={manualSessions}
                                                onChange={e => setManualSessions(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Ngày bắt đầu</label>
                                            <DateInput
                                                className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700"
                                                value={manualStartDate}
                                                onChange={setManualStartDate}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Ngày kết thúc</label>
                                            <DateInput
                                                className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700"
                                                value={manualEndDate}
                                                onChange={setManualEndDate}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Ghi chú</label>
                                        <textarea
                                            className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none"
                                            rows={3}
                                            placeholder="Ghi chú..."
                                            value={manualNote}
                                            onChange={e => setManualNote(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className="px-3 py-2 rounded text-white text-sm font-medium border-none cursor-pointer self-end disabled:opacity-50"
                                        style={{ background: 'var(--main_d)' }}
                                        disabled={saving || !manualName || !manualAmount}
                                        onClick={async () => {
                                            setSaving(true)
                                            try {
                                                const res = await fetch('/api/debt', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        studentId: createStudent._id,
                                                        courseId: null,
                                                        courseName: manualName,
                                                        amount: Number(manualAmount),
                                                        sessions: Number(manualSessions) || 0,
                                                        startDate: manualStartDate,
                                                        endDate: manualEndDate,
                                                        note: manualNote,
                                                        type: 'manual',
                                                    }),
                                                })
                                                const result = await res.json()
                                                if (res.ok) {
                                                    setShowCreatePopup(false)
                                                    setCreateStudent(null)
                                                    setManualName('')
                                                    setManualAmount('')
                                                    setManualSessions('')
                                                    setManualStartDate('')
                                                    setManualEndDate('')
                                                    setManualNote('')
                                                    reloadPage()
                                                } else {
                                                    alert(result.mes || 'Lỗi tạo học phí')
                                                }
                                            } catch (err) {
                                                alert('Lỗi kết nối')
                                            } finally {
                                                setSaving(false)
                                            }
                                        }}
                                    >
                                        {saving ? 'Đang lưu...' : 'Tạo học phí'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </CenterPopup>

        </div>
    )
}