'use client'

import { useState, useRef, useEffect } from 'react'
import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import {
    WEEKDAY_LABELS,
    FREQ_LABELS,
    TYPE_LABELS,
    renderPreviewTemplate,
    inputCls,
    labelCls,
    SubmitButton,
} from './constants'

export default function ConfigPopup({
    open,
    onClose,
    form,
    setForm,
    action,
    users = [],
    zalo = [],
    areas = [],
    templates = [],
    onUseTemplate,
    onSaveCurrentAsTemplate,
    onRunTestSend,
}) {
    const [recipientSearch, setRecipientSearch] = useState('')
    const [recipientDropdownOpen, setRecipientDropdownOpen] = useState(false)
    const [previewMode, setPreviewMode] = useState(false)
    const recipientBoxRef = useRef(null)

    const eligibleUsers = users.filter(u => u.phone && u.status !== false)
    const eligibleZalo = zalo.filter(z => z.botId)

    const filteredSaved = templates.filter(t => {
        if (!form.reportType || form.reportType === 'all') return true
        return t.reportType === 'all' || t.reportType === form.reportType
    })

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

    return (
        <FlexiblePopup
            open={open}
            onClose={onClose}
            title={form._id ? 'Cập nhật cấu hình báo cáo' : 'Tạo cấu hình báo cáo'}
            width="760px"
            renderItemList={() => (
                <form action={action} className="flex flex-col gap-3 p-4">
                    <input type="hidden" name="_id" value={form._id} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Tên cấu hình</label>
                            <input className={inputCls} name="name" placeholder="VD: Báo cáo CN tuần cho Nhật"
                                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="relative" ref={recipientBoxRef}>
                            <label className={labelCls}>Người nhận báo cáo</label>
                            {eligibleUsers.length === 0 ? (
                                <p className="text-xs text-[var(--text-secondary)] italic">Không có người dùng nào có số điện thoại.</p>
                            ) : (
                                <div>
                                    <button type="button"
                                        onClick={() => setRecipientDropdownOpen(o => !o)}
                                        className={`${inputCls} flex items-center justify-between text-left cursor-pointer`}>
                                        <span className="truncate">
                                            {form.recipientUserIds.length === 0
                                                ? 'Chọn người nhận...'
                                                : `Đã chọn ${form.recipientUserIds.length} người: ${eligibleUsers.filter(u => form.recipientUserIds.includes(u._id)).map(u => u.name).join(', ')}`}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-2">▼</span>
                                    </button>
                                    {recipientDropdownOpen && (
                                        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg flex flex-col">
                                            <input type="text" value={recipientSearch}
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
                        {form.reportType === 'attendance' && (
                            <div className="md:col-span-2 pt-1">
                                <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        name="skipIfNoClasses"
                                        value="1"
                                        checked={form.skipIfNoClasses !== false}
                                        onChange={e => setForm(f => ({ ...f, skipIfNoClasses: e.target.checked }))}
                                    />
                                    <span className="text-gray-700 font-medium">
                                        Không gửi tin nếu không có lớp học nào diễn ra trong ngày
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>

                    {areas.length > 0 && (
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col gap-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <label className="text-sm font-medium text-[var(--text-primary)]">
                                    Khu vực cơ sở (lọc lớp học) {form.areas?.length > 0 ? `(${form.areas.length} đã chọn)` : '(tất cả)'}
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
                                    const checked = form.areas?.includes(id)
                                    return (
                                        <label key={id}
                                            className={`flex items-center gap-1.5 text-sm cursor-pointer px-3 py-1.5 rounded border transition-colors ${checked ? 'bg-[var(--main_d)] text-white border-[var(--main_d)]' : 'bg-white text-[var(--text-primary)] border-gray-300'}`}>
                                            <input type="checkbox" className="hidden" checked={checked}
                                                onChange={() => setForm(f => ({
                                                    ...f,
                                                    areas: checked ? f.areas.filter(x => x !== id) : [...(f.areas || []), id],
                                                }))} />
                                            {a.name}
                                        </label>
                                    )
                                })}
                            </div>
                            <p className="text-xs text-[var(--text-secondary)]">Bỏ chọn hết = áp dụng cho tất cả khu vực.</p>
                            {(form.areas || []).map(id => (
                                <span key={`ha-${id}`}>
                                    <input type="hidden" name="areas" value={id} />
                                    <input type="hidden" name="opt_monthly_areas" value={id} />
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <label className={labelCls}>Mẫu tin nhắn</label>
                            <button type="button" onClick={() => setPreviewMode(p => !p)}
                                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer border transition-colors ${previewMode ? 'bg-[var(--main_d)] text-white border-[var(--main_d)]' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}>
                                {previewMode ? 'Quay lại sửa' : 'Xem trước'}
                            </button>
                        </div>

                        <div>
                            <select
                                className={inputCls}
                                value=""
                                onChange={e => {
                                    const selected = templates.find(t => String(t._id) === e.target.value)
                                    if (selected) {
                                        setForm(f => ({ ...f, messageTemplate: selected.content }))
                                    }
                                }}
                            >
                                <option value="">
                                    {filteredSaved.length === 0
                                        ? '-- Thư viện chưa có mẫu phù hợp (hãy tạo trong Thư viện mẫu) --'
                                        : `-- Chọn mẫu từ thư viện mẫu (${filteredSaved.length} mẫu) --`}
                                </option>
                                {filteredSaved.map(t => (
                                    <option key={t._id} value={t._id}>
                                        {t.name} - [{t.reportType === 'all' ? 'Tất cả' : (TYPE_LABELS[t.reportType] || t.reportType)}]
                                    </option>
                                ))}
                            </select>
                        </div>

                        {previewMode ? (
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-500 font-medium">Nội dung xem trước (với số liệu minh họa):</span>
                                <pre className="w-full p-3 border border-blue-200 rounded bg-blue-50/30 text-sm whitespace-pre-wrap text-gray-800 max-h-72 overflow-y-auto font-sans">
                                    {renderPreviewTemplate(form.messageTemplate, form.reportType) || '(Chưa có nội dung mẫu tin nhắn)'}
                                </pre>
                            </div>
                        ) : (
                            <textarea
                                name="messageTemplate"
                                rows="8"
                                className={`${inputCls} resize-y font-mono text-xs sm:text-sm`}
                                placeholder={'Nhập nội dung mẫu tin nhắn hoặc chọn mẫu từ ô chọn phía trên...'}
                                value={form.messageTemplate}
                                onChange={e => setForm(f => ({ ...f, messageTemplate: e.target.value }))}
                            />
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                        <button type="button" onClick={onSaveCurrentAsTemplate}
                            className="px-3 py-2 rounded bg-gray-100 border border-gray-200 text-sm cursor-pointer hover:bg-gray-200">
                            Lưu nội dung thành mẫu mới
                        </button>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={onRunTestSend}
                                className="px-4 py-2 rounded bg-amber-500 text-white text-sm font-medium border-none cursor-pointer transition-colors hover:bg-amber-600">
                                Gửi test
                            </button>
                            <SubmitButton text={form._id ? 'Cập nhật cấu hình' : 'Lưu cấu hình'} />
                        </div>
                    </div>
                </form>
            )}
        />
    )
}

