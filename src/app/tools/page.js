'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Svg_Add, Svg_Delete, Svg_Save, Svg_Pen, Svg_Close } from '@/components/(icon)/svg'

function ToolsClient() {
    const [tools, setTools] = useState([])
    const [labels, setLabels] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [search, setSearch] = useState('')
    const [filterLabel, setFilterLabel] = useState('')
    const [name, setName] = useState('')
    const [desc, setDesc] = useState('')
    const [link, setLink] = useState('')
    const [selectedLabels, setSelectedLabels] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState(null)
    const [showNewLabelInput, setShowNewLabelInput] = useState(false)
    const [newLabelName, setNewLabelName] = useState('')
    const [labelError, setLabelError] = useState('')
    const [menuPos, setMenuPos] = useState(null)
    const [menuToolId, setMenuToolId] = useState(null)
    const [descPopup, setDescPopup] = useState(null)
    const menuRef = useRef(null)

    const loadData = useCallback(async () => {
        try {
            const [toolsRes, labelsRes] = await Promise.all([
                fetch('/api/tools'),
                fetch('/api/tools/label')
            ])
            if (toolsRes.ok) { const d = await toolsRes.json(); setTools(d.data || []) }
            if (labelsRes.ok) { const d = await labelsRes.json(); setLabels(d.data || []) }
        } catch {} finally { setLoading(false) }
    }, [])

    useEffect(() => { loadData()     }, [loadData])

    const openMenu = (id, e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMenuPos({ top: rect.bottom + 4, right: document.documentElement.clientWidth - rect.right })
        setMenuToolId(id)
    }

    const closeMenu = () => { setMenuToolId(null); setMenuPos(null) }

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuToolId && !e.target.closest('[data-menu]')) closeMenu()
        }
        if (menuToolId) { document.addEventListener('mousedown', handleClickOutside); document.addEventListener('scroll', closeMenu, true) }
        return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('scroll', closeMenu, true) }
    }, [menuToolId])

    const addLabel = async () => {
        if (!newLabelName.trim()) return
        setLabelError('')
        try {
            const res = await fetch('/api/tools/label', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newLabelName.trim() })
            })
            const d = await res.json()
            if (d.status) { setLabels(prev => [...prev, d.data]); setNewLabelName(''); setShowNewLabelInput(false) }
            else setLabelError(d.mes || 'Lỗi khi tạo nhãn.')
        } catch { setLabelError('Lỗi kết nối.') }
    }

    const deleteLabel = async (id) => {
        try {
            const res = await fetch(`/api/tools/label/${id}`, { method: 'DELETE' })
            const d = await res.json()
            if (d.status) {
                setLabels(prev => prev.filter(l => l._id !== id))
                setSelectedLabels(prev => prev.filter(lId => lId !== id))
            } else {
                setLabelError(d.mes || 'Không thể xóa nhãn.')
                setTimeout(() => setLabelError(''), 15000)
            }
        } catch { setLabelError('Lỗi kết nối.') }
    }

    const toggleSelectedLabel = (labelId) => {
        setLabelError('')
        setSelectedLabels(prev =>
            prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
        )
    }

    const addTool = async (e) => {
        e.preventDefault()
        if (!name.trim()) return
        try {
            const method = editingId ? 'PUT' : 'POST'
            const url = editingId ? `/api/tools/${editingId}` : '/api/tools'
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), desc: desc.trim(), link: link.trim(), labels: selectedLabels })
            })
            const d = await res.json()
            if (d.status) {
                if (editingId) setTools(prev => prev.map(t => t._id === editingId ? d.data : t))
                else setTools(prev => [...prev, d.data])
                setName(''); setDesc(''); setLink(''); setSelectedLabels([])
                setShowForm(false); setEditingId(null)
            }
        } catch {}
    }

    const deleteTool = async (id) => {
        try {
            const res = await fetch(`/api/tools/${id}`, { method: 'DELETE' })
            const d = await res.json()
            if (d.status) { setTools(prev => prev.filter(t => t._id !== id)); setConfirmDeleteId(null); closeMenu() }
        } catch {}
    }

    const editTool = (tool) => {
        setName(tool.name)
        setDesc(tool.desc)
        setLink(tool.link)
        setSelectedLabels((tool.labels || []).map(l => typeof l === 'string' ? l : l._id))
        setEditingId(tool._id)
        setShowForm(true)
        closeMenu()
    }

    const cancelForm = () => {
        setName(''); setDesc(''); setLink(''); setSelectedLabels([])
        setShowForm(false); setEditingId(null)
    }

    const getLabelName = (id) => labels.find(l => l._id === id)?.name || ''

    const filtered = tools.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || (t.desc || '').toLowerCase().includes(search.toLowerCase())
        const matchLabel = !filterLabel || (t.labels || []).some(l => (typeof l === 'string' ? l : l._id) === filterLabel)
        return matchSearch && matchLabel
    })

    if (loading) return <div className="h-full overflow-auto p-4"><p className="text-gray-400 text-center pt-8">Đang tải...</p></div>

    return (
        <div className="h-full overflow-auto">
            <div className="p-2">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none flex-1 bg-white min-w-[140px]"
                />
                <select
                    value={filterLabel}
                    onChange={e => setFilterLabel(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none bg-white"
                >
                    <option value="">Tất cả nhãn</option>
                    {labels.map(l => (
                        <option key={l._id} value={l._id}>{l.name}</option>
                    ))}
                </select>
                <div className="flex items-center gap-2">
                    <button
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--main_d)] text-white rounded-lg text-sm font-medium cursor-pointer border-none flex-1 sm:flex-none"
                        onClick={() => { cancelForm(); setShowForm(!showForm) }}
                    >
                        <Svg_Add w={16} h={16} c="white" />
                        Thêm công cụ
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={cancelForm}>
                    <div className="bg-white rounded-xl shadow-xl p-6 w-[95vw] sm:w-[480px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <p className="text-sm font-semibold text-gray-800 mb-4">{editingId ? 'Chỉnh sửa công cụ' : 'Thêm công cụ'}</p>
                        <form onSubmit={addTool} className="flex flex-col gap-3">
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Tên công cụ"
                                className="px-3 py-2.5 border border-gray-200 rounded text-sm outline-none"
                                required
                            />
                            <textarea
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                placeholder="Mô tả"
                                className="px-3 py-2.5 border border-gray-200 rounded text-sm outline-none resize-y"
                                rows={3}
                            />
                            <input
                                value={link}
                                onChange={e => setLink(e.target.value)}
                                placeholder="Đường dẫn (URL)"
                                className="px-3 py-2.5 border border-gray-200 rounded text-sm outline-none h-[48px]"
                            />

                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1.5">Nhãn {labelError && <span className="text-red-500 ml-1 font-normal" style={{fontSize:'11px'}}>{labelError}</span>}</p>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {labels.map(l => {
                                        const active = selectedLabels.includes(l._id)
                                        return (
                                            <div key={l._id} className="relative group">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSelectedLabel(l._id)}
                                                    className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                                                        active ? 'bg-[var(--main_d)] text-white border-[var(--main_d)]' : 'bg-white text-gray-600 border-gray-300 hover:border-[var(--main_d)]'
                                                    }`}
                                                >
                                                    {l.name}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={e => { e.stopPropagation(); deleteLabel(l._id) }}
                                                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-400 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none p-0 leading-none"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                                {showNewLabelInput ? (
                                    <div className="flex gap-2">
                                        <input
                                            value={newLabelName}
                                            onChange={e => setNewLabelName(e.target.value)}
                                            placeholder="Tên nhãn mới"
                                            className="px-2.5 py-1.5 border border-gray-200 rounded text-xs outline-none flex-1"
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLabel() } }}
                                        />
                                        <button type="button" onClick={addLabel} className="px-3 py-1.5 bg-[var(--main_d)] text-white rounded text-xs cursor-pointer border-none">Thêm</button>
                                        <button type="button" onClick={() => { setShowNewLabelInput(false); setNewLabelName('') }} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-xs cursor-pointer border-none">Hủy</button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => setShowNewLabelInput(true)} className="text-xs text-[var(--main_d)] hover:underline cursor-pointer border-none bg-transparent p-0">
                                        + Tạo nhãn mới
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-[var(--main_d)] text-white rounded-lg text-sm font-medium cursor-pointer border-none">
                                    <Svg_Save w={14} h={14} c="white" />
                                    {editingId ? 'Cập nhật' : 'Lưu'}
                                </button>
                                <button type="button" onClick={cancelForm} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium cursor-pointer border-none">
                                    <Svg_Close w={12} h={12} c="currentColor" />
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                {filtered.map(tool => {
                    const toolLabels = (tool.labels || []).map(l => typeof l === 'string' ? l : l._id)
                    return (
                        <div key={tool._id} className="flex flex-col border border-gray-300 rounded-lg bg-white shadow-sm p-3 hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative w-full sm:w-[calc(50%-8px)] md:w-[calc(33.33%-11px)] lg:w-[calc(25%-12px)]">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <a href={tool.link || '#'} target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-[var(--main_d)] hover:underline line-clamp-2 break-words">
                                        {tool.name}
                                    </a>
                                </div>
                                <button data-menu onClick={e => { e.stopPropagation(); openMenu(tool._id, e) }} className="p-1 rounded hover:bg-gray-100 cursor-pointer border-none bg-transparent shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" height={16} width={16} fill="currentColor" className="text-gray-400">
                                        <path d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm56-104A56 56 0 1 0 8 96a56 56 0 1 0 112 0z" />
                                    </svg>
                                </button>
                            </div>
                            {toolLabels.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {toolLabels.map(lId => (
                                        <span key={lId} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--main_d)]/10 text-[var(--main_d)]">{getLabelName(lId)}</span>
                                    ))}
                                </div>
                            )}
                            <div className="border-t border-gray-100 my-3" />
                            {tool.desc && <p className="text-gray-500 whitespace-pre-wrap" style={{ fontSize: '12px', margin: 0 }}>
                                {tool.desc.length > 500
                                    ? <>{tool.desc.slice(0, 500)}<button onClick={() => setDescPopup(tool)} className="text-[var(--main_d)] hover:underline ml-1 cursor-pointer border-none bg-transparent p-0 text-xs font-semibold">...Xem thêm</button></>
                                    : tool.desc}
                            </p>}
                            {tool.link && (
                                <div className="mt-2">
                                    <a href={tool.link} target="_blank" rel="noopener noreferrer" className="truncate block underline underline-offset-2" style={{ fontSize: '12px', color: '#3b82f6' }}>{tool.link}</a>
                                </div>
                            )}
                        </div>
                    )
                })}
                {filtered.length === 0 && (
                    <p className="text-gray-400 italic text-center py-8 w-full">
                        {search || filterLabel ? 'Không tìm thấy công cụ phù hợp.' : 'Chưa có công cụ nào. Hãy thêm công cụ đầu tiên!'}
                    </p>
                )}
            </div>

            {menuPos && menuToolId && (
                <div ref={menuRef} data-menu className="fixed z-[9999] bg-white border rounded-lg shadow-lg py-1" style={{ top: menuPos.top, right: menuPos.right, width: '140px' }}>
                    <button onClick={() => { editTool(tools.find(t => t._id === menuToolId)); closeMenu() }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-none bg-transparent">
                        <Svg_Pen w={14} h={14} c="currentColor" /> Sửa
                    </button>
                    <button onClick={() => { setConfirmDeleteId(menuToolId); closeMenu() }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer border-none bg-transparent">
                        <Svg_Delete w={14} h={14} c="currentColor" /> Xóa
                    </button>
                </div>
            )}

            {confirmDeleteId && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setConfirmDeleteId(null)}>
                    <div className="bg-white rounded-xl shadow-xl p-6 w-[90vw] sm:w-[360px]" onClick={e => e.stopPropagation()}>
                        <p className="text-sm font-medium text-gray-800 mb-4">Bạn có chắc chắn muốn xóa công cụ này?</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium cursor-pointer border-none">Hủy</button>
                            <button onClick={() => deleteTool(confirmDeleteId)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium cursor-pointer border-none">Xóa</button>
                        </div>
                    </div>
                </div>
            )}

            {descPopup && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setDescPopup(null)}>
                    <div className="bg-white rounded-xl shadow-xl p-6 w-[90vw] sm:w-[500px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <p className="text-base font-semibold text-gray-800">{descPopup.name}</p>
                        </div>
                        {descPopup.desc && <><div className="border-t border-gray-100 my-3" /><p className="text-gray-600 whitespace-pre-wrap" style={{fontSize:'13px'}}>{descPopup.desc}</p></>}
                        {descPopup.link && <><div className="border-t border-gray-100 my-3" /><a href={descPopup.link} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline break-all" style={{color:'#2563eb'}}>{descPopup.link}</a></>}
                        <div className="flex justify-end mt-4">
                            <button onClick={() => setDescPopup(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium cursor-pointer border-none">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    )
}

export default function ToolsPage() {
    return <ToolsClient />
}
