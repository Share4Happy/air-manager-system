'use client'

import { useState, useEffect, useCallback, useActionState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import Noti from '@/components/(features)/(noti)/noti'
import {
    saveReportConfigAction,
    deleteReportConfigAction,
    toggleReportConfigAction,
    sendReportNowAction,
    sendReportTestAction,
    saveReportTemplateAction,
    deleteReportTemplateAction,
    saveReportSettingAction,
} from '@/app/actions/reportConfig.actions'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const WEEKDAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
const FREQ_LABELS = { daily: 'Hàng ngày', weekly: 'Hàng tuần', monthly: 'Hàng tháng' }
const TYPE_LABELS = { attendance: 'Chuyên cần', monthly: 'Thống kê tháng' }
const RANGE_LABELS = { day: 'Theo ngày', week: 'Theo tuần', month: 'Theo tháng' }
const MESSAGE_TYPE_LABELS = {
    periodic_report: 'Báo cáo định kỳ',
    adhoc_report: 'Báo cáo đột xuất',
    notice: 'Thông báo',
    reminder: 'Nhắc nhở',
    celebration: 'Chúc mừng',
    other: 'Khác',
}
const ATTENDANCE_OPTIONS = [
    ['classes', 'Tổng số lớp'],
    ['present', 'Có mặt'],
    ['absent', 'Vắng mặt'],
    ['unchecked', 'Chưa điểm danh'],
    ['lessonCount', 'Tổng số buổi học'],
    ['studentTurns', 'Tổng lượt học sinh'],
    ['perClass', 'Chi tiết theo lớp (theo khu vực)'],
    ['violations', 'Lỗi vi phạm'],
]
const MONTHLY_OPTIONS = [
    ['tuition', 'Học phí thu'],
    ['enrollments', 'Học sinh mới'],
    ['upgrades', 'Học sinh lên khóa'],
    ['quits', 'Học sinh nghỉ'],
    ['classesByArea', 'Lớp theo khu vực (đã hoàn thành / đang diễn ra)'],
    ['studentRank', 'Học sinh theo xếp hạng (đang học)'],
    ['trialCount', 'Lượt học thử'],
    ['trialRate', 'Tỉ lệ nhập học sau học thử'],
]
const DEFAULT_REPORT_OPTIONS = {
    attendance: { classes: true, present: true, absent: true, unchecked: false, lessonCount: false, studentTurns: false, perClass: true, violations: true },
    monthly: { tuition: true, enrollments: true, upgrades: true, quits: true, classesByArea: true, studentRank: true, trialCount: true, trialRate: true, comparePrevMonth: false },
}

function fmtDate(d) {
    if (!d) return '—'
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return '—'
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

function logContent(l) {
    return l?.status?.data?.message || l?.message || ''
}

function logRecipients(l) {
    if (l?._recipientNames?.length) return l._recipientNames
    if (l?._recipients?.length) return l._recipients
    const r = l?.status?.data?.recipients
    return Array.isArray(r) ? r : []
}

function ReportStatsChart({ data }) {
    const chartData = {
        labels: data?.labels || [],
        datasets: [
            {
                label: 'Số tin đã gửi',
                data: data?.data || [],
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    }
    return (
        <div style={{ position: 'relative', height: 220, width: '100%' }}>
            <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={chartData} />
        </div>
    )
}

function SubmitButton({ text = 'Lưu', disabled = false }) {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending || disabled}
            className="px-4 py-2 rounded bg-[var(--main_d)] text-white text-sm font-medium flex items-center gap-2 justify-center whitespace-nowrap border-none cursor-pointer transition-colors hover:bg-[var(--main_b)] disabled:opacity-50">
            {text}
        </button>
    )
}

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded bg-white text-sm outline-none text-gray-700 focus:border-[var(--main_d)]"
const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1"

const emptyConfigForm = {
    _id: '',
    name: '',
    recipientUserIds: [],
    zaloAccountId: '',
    reportType: 'attendance',
    messageTemplate: '',
    reportOptions: JSON.parse(JSON.stringify(DEFAULT_REPORT_OPTIONS)),
    frequency: 'daily',
    sendTime: '08:00',
    weekday: 1,
    monthDay: 1,
    areas: [],
}

export default function ReportConfigTab({ users = [], zalo = [], areas = [] }) {
    const [configs, setConfigs] = useState([])
    const [templates, setTemplates] = useState([])
    const [loading, setLoading] = useState(true)
    const [noti, setNoti] = useState({ open: false, status: true, mes: '' })
    const [configPopupOpen, setConfigPopupOpen] = useState(false)
    const [templatePopupOpen, setTemplatePopupOpen] = useState(false)
    const [settingsPopupOpen, setSettingsPopupOpen] = useState(false)
    const [libraryPopupOpen, setLibraryPopupOpen] = useState(false)
    const [selectedAreas, setSelectedAreas] = useState([])
    const [historyPopupOpen, setHistoryPopupOpen] = useState(false)
    const [history, setHistory] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [selectedLog, setSelectedLog] = useState(null)
    const [form, setForm] = useState(emptyConfigForm)
    const [templateForm, setTemplateForm] = useState({ _id: '', name: '', content: '', reportType: 'all', messageType: 'other' })
    const [settingsForm, setSettingsForm] = useState({ staggerMinMin: 3, staggerMaxMin: 5, hourlyLimit: 30 })
    const [selectedTemplateId, setSelectedTemplateId] = useState('')
    const [recipientSearch, setRecipientSearch] = useState('')
    const [recipientDropdownOpen, setRecipientDropdownOpen] = useState(false)
    const recipientBoxRef = useRef(null)
    const [stats, setStats] = useState(null)
    const [statsRange, setStatsRange] = useState('week')
    const [statsLoading, setStatsLoading] = useState(false)
    const [setting, setSetting] = useState(null)

    const eligibleUsers = users.filter(u => u.phone && u.status !== false)
    const eligibleZalo = zalo.filter(z => z.botId)

    const toggleRecipient = (id) => {
        setForm(f => {
            const has = f.recipientUserIds.includes(id)
            return {
                ...f,
                recipientUserIds: has
                    ? f.recipientUserIds.filter(x => x !== id)
                    : [...f.recipientUserIds, id],
            }
        })
    }

    const filteredUsers = eligibleUsers.filter(u => {
        const q = recipientSearch.trim().toLowerCase()
        if (!q) return true
        return (u.name || '').toLowerCase().includes(q) || (u.phone || '').includes(q)
    })

    useEffect(() => {
        if (!recipientDropdownOpen) return
        const onClick = (e) => {
            if (recipientBoxRef.current && !recipientBoxRef.current.contains(e.target)) {
                setRecipientDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [recipientDropdownOpen])

    const showNoti = useCallback((status, mes) => {
        setNoti({ open: true, status, mes })
    }, [])

    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true)
        try {
            const res = await fetch('/api/report-history')
            const json = await res.json()
            if (json.success) {
                const raw = json.data || []
                const groups = new Map()
                raw.forEach(l => {
                    const bid = l.status?.data?.batchId
                    const key = bid || l._id
                    const g = groups.get(key) || { logs: [] }
                    g.logs.push(l)
                    groups.set(key, g)
                })
                const merged = Array.from(groups.values()).map(g => {
                    const logs = g.logs
                    const first = logs[0]
                    const allOk = logs.every(x => !!x.status?.status)
                    const recipients = logs.flatMap(x => x.status?.data?.recipients || [])
                    const recipientNames = logs.flatMap(x => x.status?.data?.recipientNames || []).filter(Boolean)
                    return {
                        ...first,
                        status: {
                            ...(first.status || {}),
                            status: allOk,
                            message: logs.length > 1
                                ? (allOk
                                    ? `Đã gửi cho ${logs.length} người nhận.`
                                    : `${logs.filter(x => !x.status?.status).length}/${logs.length} người nhận gửi thất bại.`)
                                : first.status?.message,
                        },
                        _recipients: recipients,
                        _recipientNames: recipientNames,
                    }
                })
                setHistory(merged)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setHistoryLoading(false)
        }
    }, [])

    const openHistory = () => {
        setHistoryPopupOpen(true)
        fetchHistory()
    }

    const fetchStats = useCallback(async (range) => {
        setStatsLoading(true)
        try {
            const res = await fetch(`/api/report-stats?range=${range}`)
            const json = await res.json()
            if (json.success) setStats(json.data || null)
        } catch (err) {
            console.error(err)
        } finally {
            setStatsLoading(false)
        }
    }, [])

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/report-config')
            const json = await res.json()
            if (json.success) {
                setConfigs(json.data.configs || [])
                setTemplates(json.data.templates || [])
                if (json.data.setting) setSetting(json.data.setting)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])
    useEffect(() => { fetchStats('week') }, [fetchStats])

    const [cfgState, cfgAction] = useActionState(saveReportConfigAction, { status: null, message: '' })
    useEffect(() => {
        if (cfgState.status !== null) {
            showNoti(cfgState.status, cfgState.message)
            if (cfgState.status) {
                setConfigPopupOpen(false)
                setForm({ ...emptyConfigForm, reportOptions: JSON.parse(JSON.stringify(DEFAULT_REPORT_OPTIONS)) })
                fetchData()
            }
        }
    }, [cfgState, showNoti, fetchData])

    const [tmpState, tmpAction] = useActionState(saveReportTemplateAction, { status: null, message: '' })
    useEffect(() => {
        if (tmpState.status !== null) {
            showNoti(tmpState.status, tmpState.message)
            if (tmpState.status) {
                setTemplatePopupOpen(false)
                setTemplateForm({ _id: '', name: '', content: '', reportType: 'all', messageType: 'other' })
                fetchData()
            }
        }
    }, [tmpState, showNoti, fetchData])

    const [setState, setAction] = useActionState(saveReportSettingAction, { status: null, message: '' })
    useEffect(() => {
        if (setState.status !== null) {
            showNoti(setState.status, setState.message)
            if (setState.status) setSettingsPopupOpen(false)
        }
    }, [setState, showNoti])

    const runConfigAction = async (action, formData) => {
        const res = await action(null, formData)
        showNoti(res.status, res.message)
        if (res.status) fetchData()
    }

    const openCreateConfig = () => {
        setForm({ ...emptyConfigForm, reportOptions: JSON.parse(JSON.stringify(DEFAULT_REPORT_OPTIONS)), areas: [] })
        setSelectedAreas([])
        setRecipientSearch('')
        setRecipientDropdownOpen(false)
        setConfigPopupOpen(true)
    }

    const startEdit = (cfg) => {
        const opts = JSON.parse(JSON.stringify(DEFAULT_REPORT_OPTIONS))
        if (cfg.reportOptions) {
            Object.keys(opts.attendance).forEach(k => { if (typeof cfg.reportOptions?.attendance?.[k] === 'boolean') opts.attendance[k] = cfg.reportOptions.attendance[k] })
            Object.keys(opts.monthly).forEach(k => { if (typeof cfg.reportOptions?.monthly?.[k] === 'boolean') opts.monthly[k] = cfg.reportOptions.monthly[k] })
        }
        setForm({
            _id: cfg._id,
            name: cfg.name || '',
            recipientUserIds: (cfg.recipientUserIds || []).map(r => r?._id || r),
            zaloAccountId: cfg.zaloAccountId?._id || cfg.zaloAccountId || '',
            reportType: cfg.reportType,
            messageTemplate: cfg.messageTemplate || '',
            reportOptions: opts,
            frequency: cfg.frequency,
            sendTime: cfg.sendTime || '08:00',
            weekday: cfg.weekday || 1,
            monthDay: cfg.monthDay || 1,
            areas: (cfg.reportOptions?.monthly?.areas || []),
        })
        setSelectedAreas(cfg.reportOptions?.monthly?.areas || [])
        setConfigPopupOpen(true)
        setRecipientSearch('')
        setRecipientDropdownOpen(false)
    }

    const useTemplate = (t) => {
        setForm(f => ({ ...f, messageTemplate: t.content }))
        setLibraryPopupOpen(false)
        showNoti(true, 'Đã áp dụng mẫu vào ô tin nhắn.')
    }

    const openCreateTemplate = () => {
        setTemplateForm({ _id: '', name: '', content: '', reportType: 'all', messageType: 'other' })
        setLibraryPopupOpen(false)
        setTemplatePopupOpen(true)
    }

    const startEditTemplate = (t) => {
        setTemplateForm({ _id: t._id, name: t.name, content: t.content, reportType: t.reportType, messageType: t.messageType || 'other' })
        setTemplatePopupOpen(true)
    }

    const saveCurrentAsTemplate = () => {
        setTemplateForm(tf => ({ ...tf, content: form.messageTemplate, name: tf.name || form.name || '' }))
        setTemplatePopupOpen(true)
    }

    const openSettingsPopup = () => {
        const s = setting
        if (s) {
            setSettingsForm({
                staggerMinMin: s.staggerMinMin || 3,
                staggerMaxMin: s.staggerMaxMin || 5,
                hourlyLimit: s.hourlyLimit || 30,
            })
        }
        setSettingsPopupOpen(true)
    }

    const runTestSend = async () => {
        if (!form.recipientUserIds.length) {
            showNoti(false, 'Vui lòng chọn ít nhất một người nhận để gửi test.')
            return
        }
        const fd = new FormData()
        form.recipientUserIds.forEach(id => fd.append('recipientUserIds', id))
        fd.append('zaloAccountId', form.zaloAccountId)
        fd.append('reportType', form.reportType)
        fd.append('messageTemplate', form.messageTemplate)
        fd.append('frequency', form.frequency)
        Object.entries(form.reportOptions.attendance || {}).forEach(([k, v]) => fd.append(`opt_attendance_${k}`, v ? '1' : '0'))
        Object.entries(form.reportOptions.monthly || {}).forEach(([k, v]) => {
            if (k === 'areas') return
            fd.append(`opt_monthly_${k}`, v ? '1' : '0')
        })
        (form.areas || []).forEach(id => fd.append('opt_monthly_areas', id))
        const res = await sendReportTestAction(null, fd)
        showNoti(res.status, res.message)
    }

    return (
        <div className="flex flex-col gap-4 overflow-auto pb-6">
            <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.mes} />

            {/* ───── THỐNG KÊ TIN ĐÃ GỬI ───── */}
            <div className="bg-white border border-[var(--border-color)] rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">Thống kê tin báo cáo đã gửi</h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {Object.entries(RANGE_LABELS).map(([v, l]) => (
                            <button key={v} onClick={() => { setStatsRange(v); fetchStats(v) }}
                                className={`px-3 py-1.5 rounded text-sm cursor-pointer border transition-colors ${statsRange === v ? 'bg-[var(--main_d)] text-white border-[var(--main_d)]' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}`}>
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
                {statsLoading && !stats ? (
                    <p className="text-sm text-[var(--text-secondary)] italic">Đang tải...</p>
                ) : stats ? (
                    <ReportStatsChart data={stats} />
                ) : (
                    <p className="text-sm text-[var(--text-secondary)] italic">Chưa có dữ liệu thống kê.</p>
                )}
            </div>

            {/* ───── DANH SÁCH CẤU HÌNH ───── */}
            <div className="bg-white border border-[var(--border-color)] rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">Cấu hình báo cáo</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={openSettingsPopup}
                            className="px-4 py-2 rounded bg-gray-100 border border-gray-300 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200">
                            Cài đặt gửi tin
                        </button>
                        <button onClick={openHistory}
                            className="px-4 py-2 rounded bg-gray-100 border border-gray-300 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200">
                            Lịch sử gửi tin
                        </button>
                        <button onClick={() => setLibraryPopupOpen(true)}
                            className="px-4 py-2 rounded bg-gray-100 border border-gray-300 text-sm font-medium cursor-pointer transition-colors hover:bg-gray-200">
                            Thư viện mẫu
                        </button>
                        <button onClick={openCreateConfig}
                            className="px-4 py-2 rounded bg-[var(--main_d)] text-white text-sm font-medium border-none cursor-pointer transition-colors hover:bg-[var(--main_b)]">
                            + Tạo cấu hình mới
                        </button>
                    </div>
                </div>
                {loading ? (
                    <p className="text-sm text-[var(--text-secondary)] italic">Đang tải...</p>
                ) : configs.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)] italic">Chưa có cấu hình báo cáo nào.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-max">
                            <thead>
                                <tr className="bg-[var(--main_d)] text-white">
                                    <th className="p-2 font-medium text-left">Tên</th>
                                    <th className="p-2 font-medium text-left">Người nhận</th>
                                    <th className="p-2 font-medium text-left">Zalo gửi</th>
                                    <th className="p-2 font-medium text-left">Loại</th>
                                    <th className="p-2 font-medium text-left">Tần suất</th>
                                    <th className="p-2 font-medium text-left">Gửi lần tới</th>
                                    <th className="p-2 font-medium text-left">Gửi lần cuối</th>
                                    <th className="p-2 font-medium text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {configs.map(c => (
                                    <tr key={c._id} className="border-b border-[var(--border-color)] hover:bg-blue-50">
                                        <td className="p-2 font-medium">{c.name || '—'}</td>
                                        <td className="p-2">{(c.recipientUserIds || []).map(r => r?.name).filter(Boolean).join(', ') || '—'}</td>
                                        <td className="p-2">{c.zaloAccountId?.name || '—'}</td>
                                        <td className="p-2">{TYPE_LABELS[c.reportType] || c.reportType}</td>
                                        <td className="p-2">
                                            {FREQ_LABELS[c.frequency] || c.frequency}
                                            {c.frequency === 'weekly' && ` · ${WEEKDAY_LABELS[(c.weekday || 1) - 1]}`}
                                            {c.frequency === 'monthly' && ` · ngày ${c.monthDay || 1}`}
                                            <span className="block text-xs text-[var(--text-secondary)]">{c.sendTime}</span>
                                        </td>
                                        <td className="p-2">{fmtDate(c.nextRunAt)}</td>
                                        <td className="p-2">{fmtDate(c.lastSentAt)}</td>
                                        <td className="p-2">
                                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                <form action={toggleReportConfigAction} onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.target); await runConfigAction(toggleReportConfigAction, fd); }}>
                                                    <input type="hidden" name="_id" value={c._id} />
                                                    <button type="submit" className={`px-2 py-1 rounded text-xs cursor-pointer border-none text-white ${c.isActive ? 'bg-green-600' : 'bg-gray-400'}`}>
                                                        {c.isActive ? 'Bật' : 'Tắt'}
                                                    </button>
                                                </form>
                                                <form action={sendReportNowAction} onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.target); await runConfigAction(sendReportNowAction, fd); }}>
                                                    <input type="hidden" name="_id" value={c._id} />
                                                    <button type="submit" className="px-2 py-1 rounded bg-blue-600 text-white text-xs cursor-pointer border-none hover:bg-blue-700">
                                                        Gửi ngay
                                                    </button>
                                                </form>
                                                <button onClick={() => startEdit(c)} className="px-2 py-1 rounded bg-gray-200 text-xs cursor-pointer border-none hover:bg-gray-300">
                                                    Sửa
                                                </button>
                                                <form action={deleteReportConfigAction} onSubmit={async (e) => { e.preventDefault(); if (!confirm('Xóa cấu hình này?')) return; const fd = new FormData(e.target); await runConfigAction(deleteReportConfigAction, fd); }}>
                                                    <input type="hidden" name="_id" value={c._id} />
                                                    <button type="submit" className="px-2 py-1 rounded bg-red-600 text-white text-xs cursor-pointer border-none hover:bg-red-700">
                                                        Xóa
                                                    </button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ───── POPUP TẠO/CẬP NHẬT CẤU HÌNH ───── */}
            <FlexiblePopup
                open={configPopupOpen}
                onClose={() => setConfigPopupOpen(false)}
                title={form._id ? 'Cập nhật cấu hình báo cáo' : 'Tạo cấu hình báo cáo'}
                width="720px"
                renderItemList={() => (
                    <form action={cfgAction} className="flex flex-col gap-3 p-4">
                        <input type="hidden" name="_id" value={form._id} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Tên cấu hình</label>
                                <input className={inputCls} name="name" placeholder="VD: Báo cáo CN tuần cho Nhật"
                                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelCls}>Người nhận báo cáo ({form.recipientUserIds.length} đã chọn)</label>
                                {eligibleUsers.length === 0 ? (
                                    <p className="text-xs text-[var(--text-secondary)] italic">Không có người nhận hợp lệ (cần có số điện thoại).</p>
                                ) : (
                                    <div className="relative" ref={recipientBoxRef}>
                                        <div onClick={() => setRecipientDropdownOpen(o => !o)}
                                            className="min-h-[38px] w-full px-2 py-1.5 border border-gray-300 rounded bg-white text-sm text-gray-700 cursor-pointer flex items-center flex-wrap gap-1.5">
                                            {form.recipientUserIds.length === 0 ? (
                                                <span className="text-gray-400">Chọn người nhận...</span>
                                            ) : (
                                                form.recipientUserIds.map(id => {
                                                    const u = users.find(x => x._id === id)
                                                    return (
                                                        <span key={id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs rounded px-2 py-0.5">
                                                            <span className="max-w-[160px] truncate">{u?.name || id}{u?.phone ? ` (${u.phone})` : ''}</span>
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); toggleRecipient(id) }}
                                                                className="text-blue-800 hover:text-red-600 cursor-pointer leading-none border-none bg-transparent">
                                                                ×
                                                            </button>
                                                        </span>
                                                    )
                                                })
                                            )}
                                            <span className="ml-auto text-gray-400 text-xs">{recipientDropdownOpen ? '▲' : '▼'}</span>
                                        </div>
                                        {recipientDropdownOpen && (
                                            <div className="absolute z-30 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col">
                                                <input autoFocus value={recipientSearch}
                                                    onChange={e => setRecipientSearch(e.target.value)}
                                                    placeholder="Tìm theo tên hoặc SĐT..."
                                                    className="m-2 mb-1 px-2 py-1.5 border border-gray-300 rounded text-sm outline-none text-gray-700 focus:border-[var(--main_d)]" />
                                                <div className="flex items-center gap-2 px-3 pb-1 text-xs text-[var(--main_d)]">
                                                    <button type="button" onClick={() => setForm(f => ({ ...f, recipientUserIds: [...new Set([...f.recipientUserIds, ...eligibleUsers.map(u => u._id)])] }))}
                                                        className="cursor-pointer border-none bg-transparent hover:underline">
                                                        Chọn tất cả
                                                    </button>
                                                    <button type="button" onClick={() => setForm(f => ({ ...f, recipientUserIds: [] }))}
                                                        className="cursor-pointer border-none bg-transparent hover:underline">
                                                        Bỏ chọn
                                                    </button>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto p-1 flex flex-col">
                                                    {filteredUsers.length === 0 ? (
                                                        <p className="text-xs text-[var(--text-secondary)] italic px-2 py-1">Không tìm thấy người nhận.</p>
                                                    ) : (
                                                        filteredUsers.map(u => (
                                                            <label key={u._id} className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer hover:bg-blue-50 px-2 py-1 rounded">
                                                                <input type="checkbox" checked={form.recipientUserIds.includes(u._id)}
                                                                    onChange={() => toggleRecipient(u._id)} />
                                                                <span className="truncate">{u.name} ({u.phone})</span>
                                                            </label>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {form.recipientUserIds.map(id => (
                                            <input key={`h-${id}`} type="hidden" name="recipientUserIds" value={id} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className={labelCls}>Tài khoản Zalo gửi báo cáo</label>
                                <select className={inputCls} name="zaloAccountId" value={form.zaloAccountId}
                                    onChange={e => setForm(f => ({ ...f, zaloAccountId: e.target.value }))}>
                                    <option value="">Chọn tài khoản Zalo...</option>
                                    {eligibleZalo.map(z => (
                                        <option key={z._id} value={z._id}>{z.name || 'Bot Zalo'}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Loại báo cáo</label>
                                <div className="flex gap-4 items-center pt-1">
                                    {['attendance', 'monthly'].map(t => (
                                        <label key={t} className="flex items-center gap-1.5 text-sm text-[var(--text-primary)]">
                                            <input type="radio" name="reportType" value={t}
                                                checked={form.reportType === t}
                                                onChange={e => setForm(f => ({ ...f, reportType: e.target.value }))} />
                                            {TYPE_LABELS[t]}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Tần suất gửi</label>
                                <select className={inputCls} name="frequency" value={form.frequency}
                                    onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                                    {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Giờ gửi (HH:MM)</label>
                                <input type="time" className={inputCls} name="sendTime" value={form.sendTime}
                                    onChange={e => setForm(f => ({ ...f, sendTime: e.target.value }))} />
                            </div>
                            {form.frequency === 'weekly' && (
                                <div>
                                    <label className={labelCls}>Thứ trong tuần</label>
                                    <select className={inputCls} name="weekday" value={form.weekday}
                                        onChange={e => setForm(f => ({ ...f, weekday: Number(e.target.value) }))}>
                                        {WEEKDAY_LABELS.map((l, i) => <option key={i + 1} value={i + 1}>{l}</option>)}
                                    </select>
                                </div>
                            )}
                            {form.frequency === 'monthly' && (
                                <div>
                                    <label className={labelCls}>Ngày trong tháng</label>
                                    <input type="number" min="1" max="31" className={inputCls} name="monthDay" value={form.monthDay}
                                        onChange={e => setForm(f => ({ ...f, monthDay: Number(e.target.value) }))} />
                                </div>
                            )}
                        </div>

                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col gap-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <label className="text-sm font-medium text-[var(--text-primary)]">
                                    Nội dung báo cáo {form.reportType === 'monthly' ? '(thống kê tháng)' : '(chuyên cần)'}
                                </label>
                                <div className="flex items-center gap-2 text-xs text-[var(--main_d)]">
                                    <button type="button" onClick={() => setForm(f => {
                                        const group = f.reportType === 'monthly' ? 'monthly' : 'attendance'
                                        const list = (f.reportType === 'monthly' ? MONTHLY_OPTIONS : ATTENDANCE_OPTIONS).map(o => o[0])
                                        return { ...f, reportOptions: { ...f.reportOptions, [group]: Object.fromEntries(Object.keys(f.reportOptions[group]).map(k => [k, list.includes(k)])) } }
                                    })}
                                        className="cursor-pointer border-none bg-transparent hover:underline">
                                        Chọn tất cả
                                    </button>
                                    <button type="button" onClick={() => {
                                        const group = form.reportType === 'monthly' ? 'monthly' : 'attendance'
                                        const list = Object.keys(form.reportOptions[group])
                                        setForm(f => ({ ...f, reportOptions: { ...f.reportOptions, [group]: Object.fromEntries(list.map(k => [k, false])) } }))
                                    }}
                                        className="cursor-pointer border-none bg-transparent hover:underline">
                                        Bỏ chọn
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                                {(form.reportType === 'monthly' ? MONTHLY_OPTIONS : ATTENDANCE_OPTIONS).map(([k, label]) => (
                                    <label key={k} className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                                        <input type="checkbox"
                                            checked={form.reportOptions?.[form.reportType]?.[k]}
                                            onChange={e => setForm(f => ({
                                                ...f,
                                                reportOptions: { ...f.reportOptions, [f.reportType]: { ...f.reportOptions[f.reportType], [k]: e.target.checked } },
                                            }))} />
                                        {label}
                                    </label>
                                ))}
                                {form.reportType === 'monthly' && (
                                    <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer sm:col-span-2">
                                        <input type="checkbox"
                                            checked={form.reportOptions?.monthly?.comparePrevMonth}
                                            onChange={e => setForm(f => ({ ...f, reportOptions: { ...f.reportOptions, monthly: { ...f.reportOptions.monthly, comparePrevMonth: e.target.checked } } }))} />
                                        So sánh với tháng trước (thêm dòng tăng/giảm)
                                    </label>
                                )}
                            </div>
                            {(form.reportType === 'attendance' ? ATTENDANCE_OPTIONS : MONTHLY_OPTIONS).map(([k]) => (
                                <input key={`h-${k}`} type="hidden" name={`opt_${form.reportType}_${k}`} value={form.reportOptions?.[form.reportType]?.[k] ? '1' : '0'} />
                            ))}
                            {form.reportType === 'monthly' && (
                                <input type="hidden" name="opt_monthly_comparePrevMonth" value={form.reportOptions?.monthly?.comparePrevMonth ? '1' : '0'} />
                            )}
                        </div>

                        {form.reportType === 'monthly' && areas.length > 0 && (
                            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col gap-2">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <label className="text-sm font-medium text-[var(--text-primary)]">
                                        Khu vực (lọc phần lớp học) {form.areas.length > 0 ? `(${form.areas.length} đã chọn)` : '(tất cả)'}
                                    </label>
                                    <div className="flex items-center gap-2 text-xs text-[var(--main_d)]">
                                        <button type="button" onClick={() => setForm(f => ({ ...f, areas: areas.map(a => String(a._id)) }))}
                                            className="cursor-pointer border-none bg-transparent hover:underline">
                                            Chọn tất cả
                                        </button>
                                        <button type="button" onClick={() => setForm(f => ({ ...f, areas: [] }))}
                                            className="cursor-pointer border-none bg-transparent hover:underline">
                                            Bỏ chọn
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {areas.map(a => {
                                        const id = String(a._id)
                                        const checked = form.areas.includes(id)
                                        return (
                                            <label key={id}
                                                className={`flex items-center gap-1.5 text-sm cursor-pointer px-3 py-1.5 rounded border transition-colors ${checked ? 'bg-[var(--main_d)] text-white border-[var(--main_d)]' : 'bg-white text-[var(--text-primary)] border-gray-300'}`}>
                                                <input type="checkbox" className="hidden" checked={checked}
                                                    onChange={() => setForm(f => ({
                                                        ...f,
                                                        areas: checked ? f.areas.filter(x => x !== id) : [...f.areas, id],
                                                    }))} />
                                                {a.name}
                                            </label>
                                        )
                                    })}
                                </div>
                                <p className="text-xs text-[var(--text-secondary)]">Bỏ chọn hết = áp dụng cho tất cả khu vực. Chỉ ảnh hưởng phần lớp học.</p>
                                {form.areas.map(id => <input key={`ha-${id}`} type="hidden" name="opt_monthly_areas" value={id} />)}
                            </div>
                        )}

                        <div>
                            <label className={labelCls}>Mẫu tin nhắn</label>
                            {templates.length > 0 && (
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">Dùng mẫu từ thư viện:</span>
                                    <select className={`${inputCls} max-w-xs`} value={selectedTemplateId}
                                        onChange={e => {
                                            const id = e.target.value
                                            setSelectedTemplateId('')
                                            if (!id) return
                                            const t = templates.find(x => x._id === id)
                                            if (t) useTemplate(t)
                                        }}>
                                        <option value="">Chọn mẫu...</option>
                                        {templates.filter(t => t.reportType === 'all' || t.reportType === form.reportType).map(t => (
                                            <option key={t._id} value={t._id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <textarea name="messageTemplate" rows="7" className={`${inputCls} resize-y`}
                                placeholder={'Nhập nội dung mẫu...\n\nHỗ trợ placeholder:\n{body} - nội dung báo cáo tự sinh\n{period} - kỳ báo cáo\n{date} - ngày gửi'}
                                value={form.messageTemplate}
                                onChange={e => setForm(f => ({ ...f, messageTemplate: e.target.value }))} />
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                            <button type="button" onClick={saveCurrentAsTemplate}
                                className="px-3 py-2 rounded bg-gray-100 border border-gray-200 text-sm cursor-pointer hover:bg-gray-200">
                                Lưu nội dung thành mẫu mới
                            </button>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={runTestSend}
                                    className="px-4 py-2 rounded bg-amber-500 text-white text-sm font-medium border-none cursor-pointer transition-colors hover:bg-amber-600">
                                    Gửi test
                                </button>
                                <SubmitButton text={form._id ? 'Cập nhật cấu hình' : 'Lưu cấu hình'} />
                            </div>
                        </div>
                    </form>
                )}
            />

            {/* ───── POPUP CÀI ĐẶT GỬI TIN ───── */}
            <FlexiblePopup
                open={settingsPopupOpen}
                onClose={() => setSettingsPopupOpen(false)}
                title="Cài đặt gửi tin báo cáo"
                width="520px"
                renderItemList={() => (
                    <form action={setAction} className="flex flex-col gap-3 p-4">
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className={labelCls}>Chênh lệch giữa 2 tin (phút) — tối thiểu</label>
                                <input type="number" min="1" className={inputCls} name="staggerMinMin" value={settingsForm.staggerMinMin}
                                    onChange={e => setSettingsForm(f => ({ ...f, staggerMinMin: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <label className={labelCls}>Chênh lệch giữa 2 tin (phút) — tối đa</label>
                                <input type="number" min="1" className={inputCls} name="staggerMaxMin" value={settingsForm.staggerMaxMin}
                                    onChange={e => setSettingsForm(f => ({ ...f, staggerMaxMin: Number(e.target.value) }))} />
                            </div>
                            <div>
                                <label className={labelCls}>Giới hạn tin nhắn mỗi giờ</label>
                                <input type="number" min="1" className={inputCls} name="hourlyLimit" value={settingsForm.hourlyLimit}
                                    onChange={e => setSettingsForm(f => ({ ...f, hourlyLimit: Number(e.target.value) }))} />
                            </div>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 flex flex-col gap-1">
                            <span className="font-semibold">Lưu ý</span>
                            <span>• Thời gian gửi giữa mỗi người nhận sẽ ngẫu nhiên trong khoảng chênh lệch đã chọn (tránh spam, giảm rủi ro khoá tài khoản Zalo).</span>
                            <span>• Khi đạt giới hạn tin nhắn trong giờ, phần còn lại sẽ tạm dừng và tự gửi tiếp lúc giờ sau + 30 phút.</span>
                        </div>
                        <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
                            <SubmitButton text="Lưu cài đặt" />
                        </div>
                    </form>
                )}
            />

            {/* ───── POPUP TẠO/CẬP NHẬT MẪU ───── */}
            <FlexiblePopup
                open={templatePopupOpen}
                onClose={() => setTemplatePopupOpen(false)}
                title={templateForm._id ? 'Cập nhật mẫu tin nhắn' : 'Tạo mẫu tin nhắn'}
                width="560px"
                globalZIndex={1100}
                renderItemList={() => (
                    <form action={tmpAction} className="flex flex-col gap-3 p-4">
                        <input type="hidden" name="_id" value={templateForm._id} />
                        <div>
                            <label className={labelCls}>Tên mẫu</label>
                            <input className={inputCls} name="name" placeholder="VD: Mẫu báo cáo cuối tuần"
                                value={templateForm.name} onChange={e => setTemplateForm(t => ({ ...t, name: e.target.value }))} />
                        </div>
                        <div>
                            <label className={labelCls}>Loại báo cáo</label>
                            <select className={inputCls} name="reportType" value={templateForm.reportType}
                                onChange={e => setTemplateForm(t => ({ ...t, reportType: e.target.value }))}>
                                <option value="all">Tất cả</option>
                                <option value="attendance">Chuyên cần</option>
                                <option value="monthly">Thống kê tháng</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Loại tin nhắn</label>
                            <select className={inputCls} name="messageType" value={templateForm.messageType}
                                onChange={e => setTemplateForm(t => ({ ...t, messageType: e.target.value }))}>
                                {Object.entries(MESSAGE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <div className="mb-2 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-[var(--text-secondary)] flex flex-col gap-1.5">
                                <span className="font-semibold text-[var(--text-primary)]">Hướng dẫn tạo mẫu</span>
                                <span>• Nhập tên mẫu và nội dung, chọn loại báo cáo để lọc khi chọn mẫu trong cấu hình.</span>
                                <span>• Dữ liệu tự động (được thay khi gửi):</span>
                                <span className="pl-3">{'{body}'} — nội dung báo cáo tự sinh (chuyên cần / thống kê tháng)</span>
                                <span className="pl-3">{'{period}'} — kỳ báo cáo (vd: 05/08/2026 - 06/08/2026 hoặc Tháng 7/2026)</span>
                                <span className="pl-3">{'{date}'} — ngày gửi tin</span>
                                <span>• Ví dụ: "Kính gửi, {'{body}'} Trân trọng."</span>
                            </div>
                            <label className={labelCls}>Nội dung mẫu</label>
                            <textarea rows="6" className={`${inputCls} resize-y`} name="content"
                                value={templateForm.content} onChange={e => setTemplateForm(t => ({ ...t, content: e.target.value }))} />
                        </div>
                        <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
                            <SubmitButton text="Lưu mẫu" />
                        </div>
                    </form>
                )}
            />
            {/* ───── POPUP THƯ VIỆN MẪU ───── */}
            <FlexiblePopup
                open={libraryPopupOpen}
                onClose={() => setLibraryPopupOpen(false)}
                title="Thư viện mẫu tin nhắn"
                width="900px"
                renderItemList={() => (
                    <div className="flex flex-col gap-3 p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <button onClick={openCreateTemplate}
                                className="px-4 py-2 rounded bg-[var(--main_d)] text-white text-sm font-medium border-none cursor-pointer transition-colors hover:bg-[var(--main_b)]">
                                + Tạo mẫu mới
                            </button>
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs text-[var(--text-secondary)] flex flex-col gap-1">
                                <span className="font-semibold text-[var(--text-primary)]">Hướng dẫn tạo mẫu</span>
                                <span>• Dùng placeholder {'{body}'} (nội dung báo cáo tự sinh), {'{period}'} (kỳ báo cáo), {'{date}'} (ngày gửi).</span>
                                <span>• "Loại tin nhắn" dùng để phân loại mẫu; chọn mẫu từ thư viện ngay trong popup cấu hình để chèn vào ô tin nhắn.</span>
                            </div>
                        </div>
                        {templates.length === 0 ? (
                            <p className="text-sm text-[var(--text-secondary)] italic">Chưa có mẫu nào.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-max">
                                    <thead>
                                        <tr className="bg-[var(--main_d)] text-white">
                                            <th className="p-2 font-medium text-left">Tên</th>
                                            <th className="p-2 font-medium text-left">Loại tin nhắn</th>
                                            <th className="p-2 font-medium text-left">Loại báo cáo</th>
                                            <th className="p-2 font-medium text-left">Nội dung</th>
                                            <th className="p-2 font-medium text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {templates.map(t => (
                                            <tr key={t._id} className="border-b border-[var(--border-color)] hover:bg-blue-50 align-top">
                                                <td className="p-2 font-medium whitespace-nowrap">{t.name}</td>
                                                <td className="p-2 whitespace-nowrap">
                                                    <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                                        {MESSAGE_TYPE_LABELS[t.messageType] || 'Khác'}
                                                    </span>
                                                </td>
                                                <td className="p-2 whitespace-nowrap">
                                                    <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                                                        {t.reportType === 'all' ? 'Tất cả' : TYPE_LABELS[t.reportType] || t.reportType}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-xs text-[var(--text-secondary)] whitespace-pre-wrap line-clamp-2 max-w-md">{t.content}</td>
                                                <td className="p-2">
                                                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                        <button onClick={() => { setLibraryPopupOpen(false); startEditTemplate(t) }} className="px-2 py-1 rounded bg-gray-200 text-xs cursor-pointer border-none hover:bg-gray-300">
                                                            Sửa
                                                        </button>
                                                        <form action={deleteReportTemplateAction} onSubmit={async (e) => { e.preventDefault(); if (!confirm('Xóa mẫu này?')) return; const fd = new FormData(e.target); await runConfigAction(deleteReportTemplateAction, fd); }}>
                                                            <input type="hidden" name="_id" value={t._id} />
                                                            <button type="submit" className="px-2 py-1 rounded bg-red-600 text-white text-xs cursor-pointer border-none hover:bg-red-700">
                                                                Xóa
                                                            </button>
                                                        </form>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            />

            {/* ───── POPUP LỊCH SỬ GỬI TIN ───── */}
            <FlexiblePopup
                open={historyPopupOpen}
                onClose={() => setHistoryPopupOpen(false)}
                title="Lịch sử gửi tin báo cáo"
                width="900px"
                renderItemList={() => (
                    <div className="flex flex-col gap-3 p-4">
                        {historyLoading ? (
                            <p className="text-sm text-[var(--text-secondary)] italic">Đang tải...</p>
                        ) : history.length === 0 ? (
                            <p className="text-sm text-[var(--text-secondary)] italic">Chưa có lịch sử gửi tin báo cáo.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-max">
                                    <thead>
                                        <tr className="bg-[var(--main_d)] text-white">
                                            <th className="p-2 font-medium text-left">Thời gian</th>
                                            <th className="p-2 font-medium text-left">Zalo gửi</th>
                                            <th className="p-2 font-medium text-left">Người tạo</th>
                                            <th className="p-2 font-medium text-left">Trạng thái</th>
                                            <th className="p-2 font-medium text-left">Nội dung</th>
                                            <th className="p-2 font-medium text-center">Xem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map(l => (
                                            <tr key={l._id} className="border-b border-[var(--border-color)] hover:bg-blue-50 align-top">
                                                <td className="p-2 whitespace-nowrap">{fmtDate(l.createdAt)}</td>
                                                <td className="p-2">{l.zalo?.name || '—'}</td>
                                                <td className="p-2">{l.createBy?.name || '—'}</td>
                                                <td className="p-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs text-white ${l.status?.status ? 'bg-green-600' : 'bg-red-600'}`}>
                                                        {l.status?.status ? 'Thành công' : 'Thất bại'}
                                                    </span>
                                                    <span className="block text-xs text-[var(--text-secondary)] mt-0.5">{l.status?.message}</span>
                                                </td>
                                                <td className="p-2 text-xs text-[var(--text-secondary)] whitespace-pre-wrap line-clamp-3 max-w-xs">{logContent(l) || '—'}</td>
                                                <td className="p-2 text-center">
                                                    <button onClick={() => setSelectedLog(l)}
                                                        className="px-2 py-1 rounded bg-blue-600 text-white text-xs cursor-pointer border-none hover:bg-blue-700">
                                                        Xem
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            />

            {/* ───── POPUP XEM NỘI DUNG TIN ───── */}
            <FlexiblePopup
                open={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title="Nội dung tin đã gửi"
                width="640px"
                renderItemList={() => (
                    <div className="flex flex-col gap-3 p-4">
                        <div className="flex items-center gap-4 flex-wrap text-sm">
                            <span className="text-[var(--text-secondary)]">Thời gian: <span className="text-[var(--text-primary)]">{fmtDate(selectedLog?.createdAt)}</span></span>
                            <span className="text-[var(--text-secondary)]">Zalo gửi: <span className="text-[var(--text-primary)]">{selectedLog?.zalo?.name || '—'}</span></span>
                            <span className="text-[var(--text-secondary)]">Trạng thái: <span className={selectedLog?.status?.status ? 'text-green-600' : 'text-red-600'}>{selectedLog?.status?.status ? 'Thành công' : 'Thất bại'}</span></span>
                        </div>
                        {logRecipients(selectedLog).length > 0 && (
                            <div className="text-sm">
                                <span className="text-[var(--text-secondary)]">Người nhận: </span>
                                <span className="text-[var(--text-primary)]">{logRecipients(selectedLog).join(', ')}</span>
                            </div>
                        )}
                        {logContent(selectedLog) ? (
                            <pre className="text-sm text-[var(--text-primary)] whitespace-pre-wrap bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 max-h-96 overflow-auto">{logContent(selectedLog)}</pre>
                        ) : (
                            <p className="text-sm text-[var(--text-secondary)] italic">Không có nội dung lưu trữ cho lần gửi này (log được tạo trước bản sửa lỗi).</p>
                        )}
                        <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
                            <button onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 rounded bg-gray-200 text-sm cursor-pointer border-none hover:bg-gray-300">
                                Đóng
                            </button>
                        </div>
                    </div>
                )}
            />
        </div>
    )
}
