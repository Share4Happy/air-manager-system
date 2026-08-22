'use client'

import { useState, useEffect, useCallback, useActionState, useRef } from 'react'
import Noti from '@/components/(features)/(noti)/noti'
import {
    saveReportConfigAction,
    sendReportTestAction,
    saveReportTemplateAction,
    saveReportSettingAction,
    prepareReportSendAction,
    sendOneReportAction,
} from '@/app/actions/reportConfig.actions'

import { DEFAULT_REPORT_OPTIONS, emptyConfigForm } from './ui/report-config/constants'
import StatsChartSection from './ui/report-config/stats-chart'
import ConfigTable from './ui/report-config/config-table'
import ConfigPopup from './ui/report-config/config-popup'
import SettingsPopup from './ui/report-config/settings-popup'
import TemplatePopup from './ui/report-config/template-popup'
import TemplateLibraryPopup from './ui/report-config/template-library-popup'
import HistoryPopup from './ui/report-config/history-popup'
import LogDetailPopup from './ui/report-config/log-detail-popup'
import SendNowPopup from './ui/report-config/send-now-popup'

export default function ReportConfigTab({ users = [], zalo = [], areas = [] }) {
    const [configs, setConfigs] = useState([])
    const [templates, setTemplates] = useState([])
    const [setting, setSetting] = useState(null)
    const [loading, setLoading] = useState(true)
    const [noti, setNoti] = useState({ open: false, status: true, mes: '' })

    // Popups visibility states
    const [configPopupOpen, setConfigPopupOpen] = useState(false)
    const [templatePopupOpen, setTemplatePopupOpen] = useState(false)
    const [settingsPopupOpen, setSettingsPopupOpen] = useState(false)
    const [libraryPopupOpen, setLibraryPopupOpen] = useState(false)
    const [historyPopupOpen, setHistoryPopupOpen] = useState(false)
    const [selectedLog, setSelectedLog] = useState(null)

    // Form states
    const [form, setForm] = useState(emptyConfigForm)
    const [templateForm, setTemplateForm] = useState({ _id: '', name: '', content: '', reportType: 'all', messageType: 'other' })
    const [settingsForm, setSettingsForm] = useState({ staggerMinMin: 3, staggerMaxMin: 5, hourlyLimit: 30 })

    // Stats & History
    const [stats, setStats] = useState(null)
    const [statsRange, setStatsRange] = useState('week')
    const [statsLoading, setStatsLoading] = useState(false)
    const [history, setHistory] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)

    // Send Now state
    const [sendNowOpen, setSendNowOpen] = useState(false)
    const [sendNowConfig, setSendNowConfig] = useState(null)
    const [sendNowPrep, setSendNowPrep] = useState({ loading: false, error: '', data: null })
    const [sendStep, setSendStep] = useState('confirm')
    const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 })
    const [sendResults, setSendResults] = useState([])
    const [sendBlocked, setSendBlocked] = useState(false)
    const sendNowAbortRef = useRef(false)

    const showNoti = useCallback((status, mes) => {
        setNoti({ open: true, status, mes })
    }, [])

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/report-config')
            const json = await res.json()
            if (json.success) {
                setConfigs(json.data?.configs || [])
                setTemplates(json.data?.templates || [])
                setSetting(json.data?.setting || null)
            }
        } catch (err) {
            console.error('Fetch report config error:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchStats = useCallback(async (range) => {
        setStatsLoading(true)
        try {
            const res = await fetch(`/api/report-stats?range=${range}`)
            const json = await res.json()
            if (json.success) setStats(json.data)
        } catch (err) {
            console.error('Fetch stats error:', err)
        } finally {
            setStatsLoading(false)
        }
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
                    const logs = [...g.logs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
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
                        _logs: logs,
                    }
                })
                setHistory(merged)
            }
        } catch (err) {
            console.error('Fetch history error:', err)
        } finally {
            setHistoryLoading(false)
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
        setConfigPopupOpen(true)
    }

    const startEditConfig = (cfg) => {
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
        setConfigPopupOpen(true)
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
        if (setting) {
            setSettingsForm({
                staggerMinMin: setting.staggerMinMin || 3,
                staggerMaxMin: setting.staggerMaxMin || 5,
                hourlyLimit: setting.hourlyLimit || 30,
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
        ;(form.areas || []).forEach(id => fd.append('opt_monthly_areas', id))
        const res = await sendReportTestAction(null, fd)
        showNoti(res.status, res.message)
    }

    const openSendNow = async (cfg) => {
        sendNowAbortRef.current = false
        setSendNowConfig(cfg)
        setSendStep('confirm')
        setSendBlocked(false)
        setSendProgress({ current: 0, total: 0 })
        setSendResults([])
        setSendNowPrep({ loading: true, error: '', data: null })
        setSendNowOpen(true)
        const fd = new FormData()
        fd.append('_id', cfg._id)
        const res = await prepareReportSendAction(null, fd)
        if (res.status && res.data) {
            setSendNowPrep({ loading: false, error: '', data: res.data })
            setSendResults(res.data.targets.map(t => ({ ...t, state: 'pending', ok: null, message: '' })))
            setSendProgress({ current: 0, total: res.data.targets.length })
        } else {
            setSendNowPrep({ loading: false, error: res.message || 'Không thể chuẩn bị tin gửi.', data: null })
        }
    }

    const closeSendNow = () => {
        sendNowAbortRef.current = true
        setSendNowOpen(false)
        setSendNowConfig(null)
        setSendNowPrep({ loading: false, error: '', data: null })
        setSendStep('confirm')
        setSendResults([])
        setSendProgress({ current: 0, total: 0 })
        setSendBlocked(false)
    }

    const startSendNow = async () => {
        const d = sendNowPrep.data
        if (!d || !sendNowConfig) return
        sendNowAbortRef.current = false
        setSendStep('sending')
        setSendBlocked(false)
        const targets = d.targets
        setSendProgress({ current: 0, total: targets.length })
        setSendResults(targets.map(t => ({ ...t, state: 'pending', ok: null, message: '' })))
        let current = 0
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i]
            setSendResults(prev => prev.map((r, idx) => idx === i ? { ...r, state: 'sending' } : r))
            const fd = new FormData()
            fd.append('_id', sendNowConfig._id)
            fd.append('phone', target.phone)
            fd.append('name', target.name)
            fd.append('text', d.text)
            const res = await sendOneReportAction(null, fd)
            current++
            if (sendNowAbortRef.current) break
            if (res.ok === false && res.blocked) {
                setSendBlocked(true)
                setSendResults(prev => prev.map((r, idx) => idx === i
                    ? { ...r, state: 'done', ok: false, message: res.message || 'Hết giới hạn tin trong giờ' }
                    : r))
                setSendProgress({ current, total: targets.length })
                break
            }
            setSendResults(prev => prev.map((r, idx) => idx === i ? { ...r, state: 'done', ok: res.ok, message: res.message || '' } : r))
            setSendProgress({ current, total: targets.length })
        }
        setSendStep('done')
        fetchStats(statsRange)
    }

    return (
        <div className="flex flex-col gap-4 overflow-auto pb-6">
            <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.mes} />

            {/* ───── THỐNG KÊ TIN ĐÃ GỬI ───── */}
            <StatsChartSection
                stats={stats}
                statsRange={statsRange}
                statsLoading={statsLoading}
                onRangeChange={(r) => { setStatsRange(r); fetchStats(r) }}
            />

            {/* ───── DANH SÁCH CẤU HÌNH ───── */}
            <ConfigTable
                configs={configs}
                loading={loading}
                onOpenSettings={openSettingsPopup}
                onOpenHistory={() => { setHistoryPopupOpen(true); fetchHistory() }}
                onOpenLibrary={() => setLibraryPopupOpen(true)}
                onOpenCreateConfig={openCreateConfig}
                onEditConfig={startEditConfig}
                onSendNow={openSendNow}
                onRunAction={runConfigAction}
            />

            {/* ───── POPUP TẠO / CẬP NHẬT CẤU HÌNH ───── */}
            <ConfigPopup
                open={configPopupOpen}
                onClose={() => setConfigPopupOpen(false)}
                form={form}
                setForm={setForm}
                action={cfgAction}
                users={users}
                zalo={zalo}
                areas={areas}
                templates={templates}
                onUseTemplate={useTemplate}
                onSaveCurrentAsTemplate={saveCurrentAsTemplate}
                onRunTestSend={runTestSend}
            />

            {/* ───── POPUP CÀI ĐẶT GỬI TIN ───── */}
            <SettingsPopup
                open={settingsPopupOpen}
                onClose={() => setSettingsPopupOpen(false)}
                action={setAction}
                settingsForm={settingsForm}
                setSettingsForm={setSettingsForm}
            />

            {/* ───── POPUP TẠO / CẬP NHẬT MẪU ───── */}
            <TemplatePopup
                open={templatePopupOpen}
                onClose={() => setTemplatePopupOpen(false)}
                action={tmpAction}
                templateForm={templateForm}
                setTemplateForm={setTemplateForm}
            />

            {/* ───── POPUP THƯ VIỆN MẪU ───── */}
            <TemplateLibraryPopup
                open={libraryPopupOpen}
                onClose={() => setLibraryPopupOpen(false)}
                templates={templates}
                onOpenCreateTemplate={openCreateTemplate}
                onStartEditTemplate={startEditTemplate}
                onRunAction={runConfigAction}
            />

            {/* ───── POPUP LỊCH SỬ GỬI TIN ───── */}
            <HistoryPopup
                open={historyPopupOpen}
                onClose={() => setHistoryPopupOpen(false)}
                history={history}
                historyLoading={historyLoading}
                onSelectLog={setSelectedLog}
            />

            {/* ───── POPUP XEM NỘI DUNG LOG CHI TIẾT ───── */}
            <LogDetailPopup
                log={selectedLog}
                onClose={() => setSelectedLog(null)}
            />

            {/* ───── POPUP GỬI NGAY ───── */}
            <SendNowPopup
                open={sendNowOpen}
                onClose={closeSendNow}
                sendNowPrep={sendNowPrep}
                sendStep={sendStep}
                sendProgress={sendProgress}
                sendResults={sendResults}
                sendBlocked={sendBlocked}
                onStartSend={startSendNow}
            />
        </div>
    )
}
