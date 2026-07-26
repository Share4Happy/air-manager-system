'use client'

import { useState, useMemo } from 'react'
import React from 'react'
import Link from 'next/link'
import Pay from '@/app/student/list/ui/pay'
import BankManager from '@/components/bank-manager'
import CenterPopup from '@/components/(features)/(popup)/popup_center'

function fmtPrice(price) {
    const n = Number(price)
    if (!n || isNaN(n)) return '—'
    return n.toLocaleString('vi-VN') + ' VNĐ'
}

export default function DebtClient({ students, courseMap, attendanceMap, debts }) {
    const [search, setSearch] = useState('')
    const [viewMode, setViewMode] = useState('flat')
    const [expanded, setExpanded] = useState({})
    const [tab, setTab] = useState('tuition')
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
    const [bulkRunning, setBulkRunning] = useState(false)
    const [showBulkConfirm, setShowBulkConfirm] = useState(false)
    const [showFilter, setShowFilter] = useState(false)
    const [filterOpts, setFilterOpts] = useState({
        unpaid: true,
        paid: false,
        fullAttended: true,
        incomplete: true,
    })
    const reloadPage = async () => {
        try { await fetch('/api/clear-cache', { method: 'POST' }) } catch {}
        window.location.href = '/academic/debt?' + Date.now()
    }
    const fullAttended = (r) => r.totalLessons > 0 && r.attended >= r.totalLessons

const rows = useMemo(() => {
    const result = []
    const seen = new Set()
    const debtMap = {}
    ;(debts || []).forEach(d => {
        const sid = String(d.studentId)
        if (!debtMap[sid]) debtMap[sid] = []
        debtMap[sid].push(d)
    })
    students.forEach(s => {
        ;(s.Course || []).forEach(c => {
            const cid = String(c.course)
            const key = s._id + '-' + cid
            if (seen.has(key)) return
            seen.add(key)
            result.push({
                _id: s._id,
                ID: s.ID,
                Name: s.Name,
                Phone: s.Phone,
                AreaName: s.Area?.name || '-',
                courseId: cid,
                courseName: (courseMap[cid]?.name) || cid.slice(-6),
                price: courseMap[cid]?.price,
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
                courseId: d._id,
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

    const filtered = useMemo(() => {
        let result = rows
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(r => r.ID?.toLowerCase().includes(q) || r.Name?.toLowerCase().includes(q))
        }
        const showPaid = filterOpts.paid
        const showUnpaid = filterOpts.unpaid
        const showFull = filterOpts.fullAttended
        const showIncomplete = filterOpts.incomplete
        result = result.filter(r => {
            const full = fullAttended(r)
            const paid = r.paid
            if (paid && !showPaid) return false
            if (!paid && !showUnpaid) return false
            if (full && !showFull) return false
            if (!full && !showIncomplete) return false
            return true
        })
        return result
    }, [rows, search, filterOpts])

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
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left bg-[var(--main_d)] text-white">
                            <th className="p-2.5 font-medium">Lớp</th>
                            <th className="p-2.5 font-medium">Ngày BĐ</th>
                            <th className="p-2.5 font-medium">Ngày KT</th>
                            <th className="p-2.5 font-medium">ID</th>
                            <th className="p-2.5 font-medium">Tên</th>
                            <th className="p-2.5 font-medium">Điện thoại</th>
                            <th className="p-2.5 font-medium">Buổi</th>
                            <th className="p-2.5 font-medium">Số tiền</th>
                            <th className="p-2.5 font-medium">Đóng tiền</th>
                            <th className="p-2.5 font-medium">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(r => (
                            <tr key={r._id + '-' + r.courseId} className="border-t border-[var(--border-color)] hover:bg-[var(--hover)]">
                                <td className="p-2.5">
                                    {r.isDebt ? (
                                        <span className="inline-block px-2 py-1 rounded-md text-sm font-medium text-[var(--text-primary)]">{r.courseName}</span>
                                    ) : (
                                        <Link href={`/course/${r.courseId}`} className="inline-block px-2 py-1 rounded-md text-sm font-medium text-[var(--main_d)] bg-[var(--main_d)]/10 hover:bg-[var(--main_d)]/20 transition-colors">{r.courseName}</Link>
                                    )}
                                </td>
                                <td className="p-2.5 text-[var(--text-primary)] text-xs">{r.startDate ? new Date(r.startDate).toLocaleDateString('vi-VN') : '—'}</td>
                                <td className="p-2.5 text-[var(--text-primary)] text-xs">{r.endDate ? new Date(r.endDate).toLocaleDateString('vi-VN') : '—'}</td>
                                <td className="p-2.5 text-[var(--text-primary)]">{r.ID}</td>
                                <td className="p-2.5">
                                    <Link href={`/${r._id}`} className="text-[var(--main_d)] hover:underline">{r.Name}</Link>
                                </td>
                                <td className="p-2.5 text-[var(--text-secondary)]">{r.Phone || '—'}</td>
                                <td className="p-2.5">
                                    <span className={`font-medium ${r.totalLessons > 0 && r.attended >= r.totalLessons ? 'text-green-600' : 'text-red-600'}`}>{r.attended}/{r.totalLessons}</span>
                                </td>
                                <td className="p-2.5">{r.isDebt ? fmtPrice(Number(r.price)) : fmtPrice(r.price)}</td>
                                <td className="p-2.5">
                                    {r.paid ? (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Đã đóng</span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Chưa đóng</span>
                                    )}
                                </td>
                                <td className="p-2.5">
                                    <Pay _id={r._id} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    function renderGrouped() {
        return (
            <div className="overflow-x-auto bg-[var(--bg-primary)] rounded border border-[var(--border-color)] flex-1">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left bg-[var(--main_d)] text-white">
                            <th className="p-2.5 font-medium w-[14%]">Lớp</th>
                            <th className="p-2.5 font-medium w-[8%]">Ngày BĐ</th>
                            <th className="p-2.5 font-medium w-[8%]">Ngày KT</th>
                            <th className="p-2.5 font-medium w-[7%]">ID</th>
                            <th className="p-2.5 font-medium w-[15%]">Tên</th>
                            <th className="p-2.5 font-medium w-[10%]">Điện thoại</th>
                            <th className="p-2.5 font-medium w-[6%]">Buổi</th>
                            <th className="p-2.5 font-medium w-[14%]">Số tiền</th>
                            <th className="p-2.5 font-medium">Đóng tiền</th>
                            <th className="p-2.5 font-medium">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grouped.map(([cid, list]) => {
                            const courseName = list[0].courseName
                            const open = expanded[cid] !== false
                            return (
                                <React.Fragment key={cid}>
                                    <tr className="border-t border-[var(--border-color)] bg-[var(--main_d)]/5 hover:bg-[var(--main_d)]/10 transition-colors">
                                        <td className="p-2.5 font-semibold text-[var(--main_d)]" colSpan={10}>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setExpanded(p => ({ ...p, [cid]: !open }))}
                                                    className="flex items-center gap-2 cursor-pointer"
                                                >
                                                    <svg
                                                        className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
                                                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" height={10} width={10} fill="currentColor"
                                                    >
                                                        <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
                                                    </svg>
                                                    <Link href={`/course/${cid}`} onClick={e => e.stopPropagation()} className="px-2 py-1 rounded-md bg-[var(--main_d)]/10 hover:bg-[var(--main_d)]/20 transition-colors">{courseName}</Link>
                                                </button>
                                                <span className="ml-auto text-xs text-[var(--text-secondary)] font-normal">{list.length} học sinh</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {open && list.map(r => (
                                        <tr
                                            key={r._id + '-' + r.courseId}
                                            className="border-t border-[var(--border-color)] hover:bg-[var(--hover)]"
                                        >
                                        <td className="p-2.5">
                                            <Link href={`/course/${r.courseId}`} className="inline-block px-2 py-1 rounded-md text-sm font-medium text-[var(--main_d)] bg-[var(--main_d)]/10 hover:bg-[var(--main_d)]/20 transition-colors">{r.courseName}</Link>
                                        </td>
                                        <td className="p-2.5 text-[var(--text-primary)] text-xs">{r.startDate ? new Date(r.startDate).toLocaleDateString('vi-VN') : '—'}</td>
                                        <td className="p-2.5 text-[var(--text-primary)] text-xs">{r.endDate ? new Date(r.endDate).toLocaleDateString('vi-VN') : '—'}</td>
                                        <td className="p-2.5 text-[var(--text-primary)]">{r.ID}</td>
                                        <td className="p-2.5">
                                            <Link href={`/${r._id}`} className="text-[var(--main_d)] hover:underline">{r.Name}</Link>
                                        </td>
                                        <td className="p-2.5 text-[var(--text-secondary)]">{r.Phone || '—'}</td>
                                        <td className="p-2.5 text-[var(--text-primary)]">{r.attended}/{r.totalLessons} buổi</td>
                                        <td className="p-2.5">{fmtPrice(r.price)}</td>
                                        <td className="p-2.5">
                                                {r.paid ? (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Đã đóng</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Chưa đóng</span>
                                                )}
                                            </td>
                                            <td className="p-2.5">
                                                <Pay _id={r._id} />
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="border-t-0">
                                        <td colSpan={10} className="h-2 bg-gray-50"></td>
                                    </tr>
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
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quản lý học phí</h2>
                <button
                    onClick={() => setShowBulkConfirm(true)}
                    disabled={bulkRunning}
                    className="px-3 py-1.5 text-xs font-medium rounded text-white border-none cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    style={{ background: 'var(--green)' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={12} height={12} fill="white">
                        <path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zM337 209L209 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L303 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"/>
                    </svg>
                    {bulkRunning ? 'Đang xử lý...' : 'Hoàn tất tất cả'}
                </button>
            </div>

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
            <div className="flex items-center gap-2 flex-wrap">
                <input
                    className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 flex-1 min-w-[150px]"
                    placeholder="Tìm theo tên hoặc ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="relative">
                    <button
                        onClick={() => setShowFilter(!showFilter)}
                        className="px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--main_d)] transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={12} height={12} fill="currentColor">
                            <path d="M3.9 54.9C10.5 40.9 24.5 32 40 32l432 0c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9 320 448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6l0-79.1L9 97.5C-.7 85.4-2.8 68.8 3.9 54.9z"/>
                        </svg>
                        Bộ lọc
                    </button>
                    {showFilter && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                            <div className="absolute z-20 top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
                                <p className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Đóng tiền</p>
                                <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" checked={filterOpts.unpaid} onChange={e => setFilterOpts(p => ({ ...p, unpaid: e.target.checked }))} className="accent-red-600" />
                                    Chưa đóng
                                </label>
                                <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" checked={filterOpts.paid} onChange={e => setFilterOpts(p => ({ ...p, paid: e.target.checked }))} className="accent-green-600" />
                                    Đã đóng
                                </label>
                                <div className="border-t border-gray-100 my-1" />
                                <p className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Số buổi</p>
                                <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" checked={filterOpts.fullAttended} onChange={e => setFilterOpts(p => ({ ...p, fullAttended: e.target.checked }))} className="accent-blue-600" />
                                    Đủ buổi
                                </label>
                                <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" checked={filterOpts.incomplete} onChange={e => setFilterOpts(p => ({ ...p, incomplete: e.target.checked }))} className="accent-orange-600" />
                                    Chưa đủ buổi
                                </label>
                            </div>
                        </>
                    )}
                </div>
                <button
                    onClick={() => setViewMode(v => v === 'flat' ? 'grouped' : 'flat')}
                    className="px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--main_d)] transition-colors whitespace-nowrap"
                >
                    {viewMode === 'flat' ? 'Theo lớp' : 'Danh sách'}
                </button>
                <button
                    onClick={() => setShowCreatePopup(true)}
                    className="px-3 py-2 text-xs sm:text-sm font-medium rounded text-white border-none cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                    style={{ background: 'var(--main_d)' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={12} height={12} fill="white">
                        <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/>
                    </svg>
                    Thêm học phí
                </button>
                <button
                    onClick={() => reloadPage()}
                    className="px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--main_d)] transition-colors whitespace-nowrap flex items-center gap-1"
                    title="Tải lại dữ liệu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={12} height={12} fill="currentColor">
                        <path d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 336 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l128 0c0 0 0 0 0 0l.4 0c17.7 0 32-14.3 32-32l0-128c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 416c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c0 0 0 0 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.8c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352l34.4 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z" />
                    </svg>
                    Tải lại
                </button>
            </div>

            {filtered.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-secondary)]">
                    Không có học sinh nợ học phí
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
                                            <input
                                                className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700"
                                                type="date"
                                                value={manualStartDate}
                                                onChange={e => setManualStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Ngày kết thúc</label>
                                            <input
                                                className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700"
                                                type="date"
                                                value={manualEndDate}
                                                onChange={e => setManualEndDate(e.target.value)}
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

            {showBulkConfirm && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => !bulkRunning && setShowBulkConfirm(false)} />
                    <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
                        <p className="text-sm text-gray-700 mb-2">
                            Thao tác này sẽ tạo hóa đơn (đóng trực tiếp) cho <strong>tất cả học sinh chưa đóng học phí</strong>.
                        </p>
                        <p className="text-xs text-orange-600">Hành động này không thể hoàn tác.</p>
                        <div className="flex gap-2 justify-end mt-4">
                            <button
                                onClick={() => setShowBulkConfirm(false)}
                                disabled={bulkRunning}
                                className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer border-none disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                disabled={bulkRunning}
                                className="px-4 py-2 text-sm rounded text-white transition-colors cursor-pointer border-none disabled:opacity-50"
                                style={{ background: 'var(--green)' }}
                                onClick={async () => {
                                    setBulkRunning(true)
                                    try {
                                        const res = await fetch('/api/pay/bulk-all', { method: 'POST' })
                                        const result = await res.json()
                                        alert(result.mes || (res.ok ? 'Hoàn tất' : 'Lỗi'))
                                        setShowBulkConfirm(false)
                                        reloadPage()
                                    } catch {
                                        alert('Lỗi kết nối')
                                    } finally {
                                        setBulkRunning(false)
                                    }
                                }}
                            >
                                {bulkRunning ? 'Đang xử lý...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}