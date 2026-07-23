'use client'

import { useState, useEffect, useRef } from 'react'
import { Svg_Add, Svg_Delete, Svg_Save, Svg_Pen, Svg_Close } from '@/components/(icon)/svg'

const STORAGE_KEY = 'tools_list'

function ToolsClient() {
    const [tools, setTools] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [search, setSearch] = useState('')
    const [name, setName] = useState('')
    const [desc, setDesc] = useState('')
    const [link, setLink] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [openMenuId, setOpenMenuId] = useState(null)
    const menuRef = useRef(null)

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try { setTools(JSON.parse(saved)) } catch {}
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuId(null)
            }
        }
        if (openMenuId) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [openMenuId])

    const saveTools = (newTools) => {
        setTools(newTools)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTools))
    }

    const addTool = (e) => {
        e.preventDefault()
        if (!name.trim()) return
        if (editingId) {
            saveTools(tools.map(t => t.id === editingId ? { ...t, name: name.trim(), desc: desc.trim(), link: link.trim() } : t))
        } else {
            const newTool = { id: Date.now(), name: name.trim(), desc: desc.trim(), link: link.trim() }
            saveTools([...tools, newTool])
        }
        setName('')
        setDesc('')
        setLink('')
        setShowForm(false)
        setEditingId(null)
    }

    const deleteTool = (id) => {
        saveTools(tools.filter(t => t.id !== id))
        setOpenMenuId(null)
    }

    const editTool = (tool) => {
        setName(tool.name)
        setDesc(tool.desc)
        setLink(tool.link)
        setEditingId(tool.id)
        setShowForm(true)
        setOpenMenuId(null)
    }

    const cancelForm = () => {
        setName('')
        setDesc('')
        setLink('')
        setShowForm(false)
        setEditingId(null)
    }

    const filtered = tools.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.desc.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-4 h-full overflow-auto">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold">Công cụ</h1>
                <div className="flex items-center gap-2">
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none w-[200px]"
                    />
                    <button
                        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--main_d)] text-white rounded-lg text-sm font-medium cursor-pointer border-none"
                        onClick={() => { cancelForm(); setShowForm(!showForm) }}
                    >
                        <Svg_Add w={16} h={16} c="white" />
                        Thêm công cụ
                    </button>
                </div>
            </div>

            {showForm && (
                <form onSubmit={addTool} className="mb-4 p-4 border rounded-lg bg-white shadow-sm flex flex-col gap-3">
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Tên công cụ"
                        className="px-3 py-2.5 border border-gray-200 rounded text-sm outline-none"
                        required
                    />
                    <input
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                        placeholder="Mô tả"
                        className="px-3 py-2.5 border border-gray-200 rounded text-sm outline-none"
                    />
                    <input
                        value={link}
                        onChange={e => setLink(e.target.value)}
                        placeholder="Đường dẫn (URL)"
                        className="px-3 py-2.5 border border-gray-200 rounded text-sm outline-none"
                    />
                    <div className="flex gap-2">
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
            )}

            <div className="flex flex-wrap gap-4">
                {filtered.map(tool => (
                    <div key={tool.id} className="flex flex-col border rounded-lg bg-white shadow-sm w-[calc(25%-12px)] p-5 hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative">
                        <div className="flex items-start justify-between">
                            <a
                                href={tool.link || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-base font-semibold text-[var(--main_d)] hover:underline"
                            >
                                {tool.name}
                            </a>
                            <div className="relative shrink-0 ml-2" ref={openMenuId === tool.id ? menuRef : null}>
                                <button
                                    onClick={() => setOpenMenuId(openMenuId === tool.id ? null : tool.id)}
                                    className="p-1 rounded hover:bg-gray-100 cursor-pointer border-none bg-transparent"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" height={16} width={16} fill="currentColor" className="text-gray-400">
                                        <path d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm56-104A56 56 0 1 0 8 96a56 56 0 1 0 112 0z" />
                                    </svg>
                                </button>
                                {openMenuId === tool.id && (
                                    <div className="absolute right-0 top-full mt-1 w-[140px] bg-white border rounded-lg shadow-lg z-50 py-1">
                                        <button
                                            onClick={() => editTool(tool)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-none bg-transparent"
                                        >
                                            <Svg_Pen w={14} h={14} c="currentColor" />
                                            Chỉnh sửa
                                        </button>
                                        <button
                                            onClick={() => deleteTool(tool.id)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer border-none bg-transparent"
                                        >
                                            <Svg_Delete w={14} h={14} c="currentColor" />
                                            Xóa
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 my-3" />

                        {tool.desc && <p className="text-sm text-gray-500">{tool.desc}</p>}

                        {tool.link && (
                            <div className="mt-2">
                                <a
                                    href={tool.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-600 truncate block"
                                >
                                    {tool.link}
                                </a>
                            </div>
                        )}
                    </div>
                ))}
                {filtered.length === 0 && (
                    <p className="text-gray-400 italic text-center py-8 w-full">
                        {search ? 'Không tìm thấy công cụ phù hợp.' : 'Chưa có công cụ nào. Hãy thêm công cụ đầu tiên!'}
                    </p>
                )}
            </div>
        </div>
    )
}

export default function ToolsPage() {
    return <ToolsClient />
}
