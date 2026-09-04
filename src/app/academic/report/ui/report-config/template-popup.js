'use client'

import { useRef, useState, useEffect } from 'react'
import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import {
    inputCls,
    labelCls,
    MESSAGE_TYPE_LABELS,
    TYPE_LABELS,
    SubmitButton,
    getPlaceholderGroups,
    PRESET_TEMPLATES,
    renderPreviewTemplate,
} from './constants'

export default function TemplatePopup({
    open,
    onClose,
    action,
    templateForm,
    setTemplateForm,
}) {
    const [previewMode, setPreviewMode] = useState(false)
    const [templateMenuOpen, setTemplateMenuOpen] = useState(false)
    const textareaRef = useRef(null)
    const templateMenuRef = useRef(null)

    const placeholderGroups = getPlaceholderGroups(templateForm.reportType)

    useEffect(() => {
        if (!templateMenuOpen) return
        const onClick = (e) => {
            if (templateMenuRef.current && !templateMenuRef.current.contains(e.target)) {
                setTemplateMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [templateMenuOpen])

    const insertTag = (tag) => {
        const textarea = textareaRef.current
        const currentText = templateForm.content || ''
        if (!textarea) {
            setTemplateForm(t => ({ ...t, content: (t.content ? t.content + ' ' : '') + tag }))
            return
        }
        const start = textarea.selectionStart || 0
        const end = textarea.selectionEnd || 0
        const newText = currentText.substring(0, start) + tag + currentText.substring(end)
        setTemplateForm(t => ({ ...t, content: newText }))
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + tag.length, start + tag.length)
        }, 0)
    }

    const importTemplate = (item) => {
        setTemplateForm(t => ({
            ...t,
            content: item.content,
            name: t.name ? t.name : item.name,
        }))
        setTemplateMenuOpen(false)
    }

    const filteredPresets = PRESET_TEMPLATES.filter(p => {
        if (!templateForm.reportType || templateForm.reportType === 'all') return true
        return p.reportType === templateForm.reportType
    })

    return (
        <FlexiblePopup
            open={open}
            onClose={onClose}
            title={templateForm._id ? 'Cập nhật mẫu tin nhắn' : 'Tạo mẫu tin nhắn'}
            width="640px"
            globalZIndex={1100}
            renderItemList={() => (
                <form action={action} className="flex flex-col gap-3 p-4">
                    <input type="hidden" name="_id" value={templateForm._id} />
                    <div>
                        <label className={labelCls}>Tên mẫu</label>
                        <input className={inputCls} name="name" placeholder="VD: Mẫu báo cáo chuyên cần tối"
                            value={templateForm.name} onChange={e => setTemplateForm(t => ({ ...t, name: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <label className={labelCls}>Nội dung mẫu</label>
                            <div className="flex items-center gap-2">
                                <div className="relative" ref={templateMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setTemplateMenuOpen(o => !o)}
                                        className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium cursor-pointer hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5"
                                    >
                                        <span>Chọn mẫu mặc định</span>
                                        <span className="text-[10px]">▼</span>
                                    </button>
                                    {templateMenuOpen && (
                                        <div className="absolute right-0 top-full mt-1 w-80 max-h-80 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-1.5 flex flex-col gap-1 text-left">
                                            <div className="px-2 py-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                                Mẫu mặc định tham khảo ({filteredPresets.length})
                                            </div>
                                            {filteredPresets.map(preset => (
                                                <button
                                                    key={preset.id}
                                                    type="button"
                                                    onClick={() => importTemplate(preset)}
                                                    className="p-2 rounded hover:bg-blue-50 text-left cursor-pointer border-none bg-transparent transition-colors flex flex-col gap-0.5 group"
                                                >
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="text-xs font-semibold text-gray-800 group-hover:text-[var(--main_d)]">
                                                            {preset.name}
                                                        </span>
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                            {TYPE_LABELS[preset.reportType] || 'Chung'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-gray-400 line-clamp-1 font-mono">
                                                        {preset.content.split('\n')[0]}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button type="button" onClick={() => setPreviewMode(p => !p)}
                                    className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer border transition-colors ${previewMode ? 'bg-[var(--main_d)] text-white border-[var(--main_d)]' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}>
                                    {previewMode ? 'Quay lại sửa' : 'Xem trước'}
                                </button>
                            </div>
                        </div>

                        {/* Thẻ biến số chèn nhanh (Tag Chips phân nhóm) */}
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-2.5">
                            <span className="text-xs text-gray-600 font-medium">Nhấp vào thẻ biến số để chèn nhanh vào mẫu:</span>
                            <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                                {placeholderGroups.map(group => (
                                    <div key={group.title} className="flex flex-col gap-1">
                                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{group.title}</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {group.items.map(p => (
                                                <button
                                                    key={p.tag}
                                                    type="button"
                                                    title={`${p.tag}: ${p.desc}`}
                                                    onClick={() => insertTag(p.tag)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-[var(--main_d)] hover:text-white hover:border-[var(--main_d)] transition-all text-xs cursor-pointer shadow-sm active:scale-95"
                                                >
                                                    <span className="font-medium">{p.label}</span>
                                                    <span className="text-[10px] opacity-75 font-mono">{p.tag}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {previewMode ? (
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-500 font-medium">Nội dung xem trước minh họa:</span>
                                <pre className="w-full p-3 border border-blue-200 rounded bg-blue-50/30 text-sm whitespace-pre-wrap text-gray-800 max-h-64 overflow-y-auto font-sans">
                                    {renderPreviewTemplate(templateForm.content, templateForm.reportType) || '(Chưa có nội dung mẫu tin nhắn)'}
                                </pre>
                            </div>
                        ) : (
                            <textarea
                                ref={textareaRef}
                                rows="7"
                                className={`${inputCls} resize-y font-mono text-xs sm:text-sm`}
                                name="content"
                                placeholder={'Nhập nội dung mẫu...\n\nVí dụ:\nBáo cáo {period}:\n• Số lớp: {tong_so_lop}\n• Có mặt: {co_mat}\n\nChi tiết:\n{chi_tiet_lop}'}
                                value={templateForm.content}
                                onChange={e => setTemplateForm(t => ({ ...t, content: e.target.value }))}
                            />
                        )}
                    </div>

                    <div className="flex justify-end pt-3 border-t border-[var(--border-color)]">
                        <SubmitButton text="Lưu mẫu" />
                    </div>
                </form>
            )}
        />
    )
}

