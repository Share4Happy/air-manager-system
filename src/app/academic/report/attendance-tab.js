'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import DateInput from '@/components/(ui)/(input)/DateInput'

function toDateStr(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

function getDateContext(selected) {
    const today = toDateStr(new Date())
    if (selected === today) return { text: 'Hôm nay — dữ liệu thời gian thực', color: 'text-blue-600' }
    if (selected < today) return { text: 'Ngày trong quá khứ — hiển thị dữ liệu lịch sử', color: 'text-yellow-600' }
    return { text: 'Ngày trong tương lai — chưa có dữ liệu điểm danh', color: 'text-orange-600' }
}

const ITEMS_PER_PAGE = 10

function getTeacherCheckin(checkin) {
    if (!checkin || !checkin.time) return { text: 'Chưa checkin', cls: 'bg-rose-500' }
    if (checkin.status === 'tre') return { text: 'Checkin trễ', cls: 'bg-amber-500' }
    return { text: 'Checkin đúng giờ', cls: 'bg-emerald-600' }
}

export default function AttendanceTab() {
    const today = new Date()
    const [selectedDate, setSelectedDate] = useState(toDateStr(today))
    const [lessons, setLessons] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const d = new Date(selectedDate + 'T00:00:00')
            const month = d.getMonth() + 1
            const year = d.getFullYear()

            const res = await fetch(`/api/checkin?month=${month}&year=${year}`)
            const json = await res.json()
            let dayLessons = (json.data || []).filter(l => {
                const lDate = new Date(l.date)
                return toDateStr(lDate) === selectedDate
            })

            const enriched = dayLessons.map(l => {
                const students = l.students || []
                const total = students.length
                const present = students.filter(s => {
                    if (l.type === 'trial') return s.checkin === true
                    return s.Learn?.[0]?.Checkin === 1
                }).length
                const absent = students.filter(s => {
                    if (l.type === 'trial') return s.checkin === false
                    return [2, 3].includes(s.Learn?.[0]?.Checkin)
                }).length
                const unchecked = students.filter(s => {
                    if (l.type === 'trial') return s.checkin == null
                    return s.Learn?.[0]?.Checkin === 0 || s.Learn?.[0]?.Checkin == null
                }).length
                const typeLabel = l.type === 'trial' ? 'Lớp học thử' : 'Lớp thường'
                return { ...l, totalStudents: total, present, absent, unchecked, typeLabel }
            })

            setLessons(enriched)
            setPage(1)
        } catch (err) {
            console.error(err)
            setLessons([])
        } finally {
            setLoading(false)
        }
    }, [selectedDate])

    useEffect(() => { fetchData() }, [fetchData])

    const totalStudents = lessons.reduce((s, l) => s + l.totalStudents, 0)
    const totalPresent = lessons.reduce((s, l) => s + l.present, 0)
    const totalAbsent = lessons.reduce((s, l) => s + l.absent, 0)
    const totalRate = totalStudents > 0 ? Math.round(totalPresent / totalStudents * 100) : 0

    const totalPages = Math.ceil(lessons.length / ITEMS_PER_PAGE)
    const startIdx = (page - 1) * ITEMS_PER_PAGE
    const pageItems = lessons.slice(startIdx, startIdx + ITEMS_PER_PAGE)

    const dateCtx = getDateContext(selectedDate)

    return (
        <div className="flex flex-col gap-4 overflow-auto pb-4">
            <div className="flex items-center gap-3 flex-wrap">
                <label className="text-sm font-medium text-[var(--text-primary)]">Ngày:</label>
                <DateInput
                    value={selectedDate}
                    onChange={setSelectedDate}
                    className="px-3 py-2 border border-gray-300 rounded bg-white text-sm outline-none text-gray-700 font-medium"
                />
                <span className={`text-xs font-medium ${dateCtx.color}`}>{dateCtx.text}</span>
                <span className="text-xs text-[var(--text-secondary)] ml-auto">{lessons.length} lớp</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                {[
                    { label: 'Tổng số lớp', value: lessons.length, bg: 'bg-violet-50', border: 'border-violet-200', textColor: 'text-violet-700', valueColor: 'text-violet-800' },
                    { label: 'Tổng số học sinh', value: totalStudents, bg: 'bg-blue-50', border: 'border-blue-200', textColor: 'text-blue-700', valueColor: 'text-blue-800' },
                    { label: 'Học sinh có mặt', value: totalPresent, bg: 'bg-emerald-50', border: 'border-emerald-200', textColor: 'text-emerald-700', valueColor: 'text-emerald-800' },
                    { label: 'Học sinh vắng', value: totalAbsent, bg: 'bg-rose-50', border: 'border-rose-200', textColor: 'text-rose-700', valueColor: 'text-rose-800' },
                    { label: 'Tỉ lệ chuyên cần', value: `${totalRate}%`, bg: 'bg-amber-50', border: 'border-amber-200', textColor: 'text-amber-700', valueColor: totalRate >= 80 ? 'text-emerald-800' : totalRate >= 50 ? 'text-amber-800' : 'text-rose-800' },
                ].map(c => (
                    <div key={c.label} className={`flex flex-col items-center justify-center p-3 sm:p-4 ${c.bg} ${c.border} border rounded-xl text-center gap-0.5 sm:gap-1`}>
                        <span className={`text-[11px] sm:text-xs font-medium ${c.textColor}`}>{c.label}</span>
                        <strong className={`text-lg sm:text-xl lg:text-2xl font-bold ${c.valueColor}`}>{c.value}</strong>
                    </div>
                ))}
            </div>

            {loading || lessons.length === 0 ? (
                <div className="flex items-center justify-center bg-white border border-[var(--border-color)] rounded-lg" style={{ height: 560 }}>
                    <p className="text-base text-[var(--text-secondary)] italic">{loading ? 'Đang tải...' : 'Hôm nay không có buổi học nào'}</p>
                </div>
            ) : (
                <>
                    {/* Desktop: Table */}
                    <div className="hidden md:block bg-white border border-[var(--border-color)] rounded-lg" style={{ height: 560 }}>
                        <div className="overflow-auto h-full">
                            <table className="w-full text-sm">
                                <colgroup>
                                    <col style={{ width: '6%' }} />
                                    <col style={{ width: '17%' }} />
                                    <col style={{ width: '14%' }} />
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '7%' }} />
                                    <col style={{ width: '7%' }} />
                                    <col style={{ width: '7%' }} />
                                    <col style={{ width: '11%' }} />
                                </colgroup>
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-[var(--main_d)] text-white">
                                        <th className="p-2 font-medium text-center">STT</th>
                                        <th className="p-2 font-medium text-left">Lớp</th>
                                        <th className="p-2 font-medium text-left">Giáo viên</th>
                                        <th className="p-2 font-medium text-left">Phòng</th>
                                        <th className="p-2 font-medium text-left">Phân loại</th>
                                        <th className="p-2 font-medium text-left">Giờ</th>
                                        <th className="p-2 font-medium text-center">Sĩ số</th>
                                        <th className="p-2 font-medium text-center">Có mặt</th>
                                        <th className="p-2 font-medium text-center">Vắng</th>
                                        <th className="p-2 font-medium text-center">Điểm danh GV</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.map((l, i) => {
                                        const hasUnchecked = l.unchecked > 0
                                        const uniqueKey = `${l._id}-${l.type}-${l.date}`
                                        return (
                                            <tr key={uniqueKey} className="border-b border-[var(--border-color)] hover:bg-blue-50 transition-colors">
                                                <td className="p-2 text-center text-[var(--text-secondary)]">{startIdx + i + 1}</td>
                                                <td className="p-2 font-medium">
                                                    <div className="flex items-center gap-1">
                                                        <Link href={`/course/${l.courseId || l._id}`} className="text-[var(--main_d)] hover:underline font-semibold truncate">
                                                            {l.courseId || l.courseName}
                                                        </Link>
                                                        {hasUnchecked && (
                                                            <span className="shrink-0 px-1 py-0.5 rounded font-bold bg-orange-500 text-white" style={{ fontSize: 11 }}>
                                                                Chưa ĐD
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-2 text-[var(--text-secondary)] truncate">{l.teacher?.name || '—'}</td>
                                                <td className="p-2 text-[var(--text-secondary)]">{l.room?.name || '—'}</td>
                                                <td className="p-2">
                                                    <span className={`px-1.5 py-0.5 rounded font-semibold text-white text-sm ${
                                                        l.typeLabel === 'Lớp học thử' ? 'bg-purple-600' : 'bg-blue-600'
                                                    }`}>
                                                        {l.typeLabel === 'Lớp học thử' ? 'Học thử' : 'Thường'}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-[var(--text-secondary)]">{l.time || '—'}</td>
                                                <td className="p-2 text-center text-[var(--text-primary)] font-medium">{l.totalStudents}</td>
                                                <td className="p-2 text-center text-green-600 font-bold">{l.present}</td>
                                                <td className="p-2 text-center text-red-600 font-bold">{l.absent}</td>
                                                <td className="p-2 text-center">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded font-semibold text-white text-xs ${getTeacherCheckin(l.checkin).cls}`}>
                                                        {getTeacherCheckin(l.checkin).text}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile: Cards */}
                    <div className="md:hidden flex flex-col gap-2">
                        {pageItems.map((l, i) => {
                            const hasUnchecked = l.unchecked > 0
                            const uniqueKey = `${l._id}-${l.type}-${l.date}`
                            return (
                                <div key={uniqueKey} className="bg-white border border-[var(--border-color)] rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-xs text-[var(--text-secondary)] shrink-0">#{startIdx + i + 1}</span>
                                            <Link href={`/course/${l.courseId || l._id}`} className="text-[var(--main_d)] font-semibold text-sm hover:underline truncate">
                                                {l.courseId || l.courseName}
                                            </Link>
                                            {hasUnchecked && (
                                                <span className="shrink-0 px-1 py-0.5 rounded font-bold bg-orange-500 text-white" style={{ fontSize: 10 }}>
                                                    Chưa ĐD
                                                </span>
                                            )}
                                        </div>
                                        <span className={`px-1.5 py-0.5 rounded font-semibold text-white text-xs shrink-0 ml-1 ${
                                            l.typeLabel === 'Lớp học thử' ? 'bg-purple-600' : 'bg-blue-600'
                                        }`}>
                                            {l.typeLabel === 'Lớp học thử' ? 'Học thử' : 'Thường'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                        <span className="text-[var(--text-secondary)]">Giáo viên:</span>
                                        <span className="text-[var(--text-primary)] truncate">{l.teacher?.name || '—'}</span>
                                        <span className="text-[var(--text-secondary)]">Phòng:</span>
                                        <span className="text-[var(--text-primary)]">{l.room?.name || '—'}</span>
                                        <span className="text-[var(--text-secondary)]">Giờ:</span>
                                        <span className="text-[var(--text-primary)]">{l.time || '—'}</span>
                                        <span className="text-[var(--text-secondary)]">Sĩ số:</span>
                                        <span className="text-[var(--text-primary)] font-medium">{l.totalStudents}</span>
                                        <span className="text-[var(--text-secondary)]">Có mặt:</span>
                                        <span className="text-green-600 font-bold">{l.present}</span>
                                        <span className="text-[var(--text-secondary)]">Vắng:</span>
                                        <span className="text-red-600 font-bold">{l.absent}</span>
                                        <span className="text-[var(--text-secondary)]">Điểm danh GV:</span>
                                        <span className={`inline-block px-1.5 py-0.5 rounded font-semibold text-white text-xs ${getTeacherCheckin(l.checkin).cls}`}>
                                            {getTeacherCheckin(l.checkin).text}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {!loading && lessons.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                        className="px-3 py-1.5 rounded bg-gray-200 text-sm cursor-pointer border-none disabled:opacity-40 hover:bg-gray-100">
                        Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded text-xs sm:text-sm cursor-pointer border-none ${
                                p === page ? 'bg-[var(--main_d)] text-white' : 'bg-gray-200 hover:bg-gray-100'
                            }`}>
                            {p}
                        </button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                        className="px-3 py-1.5 rounded bg-gray-200 text-sm cursor-pointer border-none disabled:opacity-40 hover:bg-gray-100">
                        Sau
                    </button>
                </div>
            )}
        </div>
    )
}
