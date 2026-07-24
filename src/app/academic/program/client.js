'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProgramList from '@/app/course/ui/book-item'
import CourseManagementPage from '@/app/course/ui/createbook'
import Loading from '@/components/(ui)/(loading)/loading'
import { reloadBook } from '@/data/actions/reload'

export default function ProgramClient({ programs }) {
    const router = useRouter()
    const [isReloading, setIsReloading] = useState(false)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')

    const reloadData = async () => {
        setIsReloading(true)
        try {
            await reloadBook()
            router.refresh()
        } catch (e) {
            console.error(e)
        } finally {
            setIsReloading(false)
        }
    }

    const typeOptions = [...new Set(programs.map(p => p.Type).filter(Boolean))]
    const typeCounts = {}
    programs.forEach(p => { if (p.Type) typeCounts[p.Type] = (typeCounts[p.Type] || 0) + 1 })

    const filtered = programs.filter(p => {
        if (search.trim() && !p.Name?.toLowerCase().includes(search.toLowerCase()) && !p.ID?.toLowerCase().includes(search.toLowerCase())) return false
        if (typeFilter && p.Type !== typeFilter) return false
        return true
    })

    return (
        <div className="h-full flex flex-col">
            <p className="text-xl font-semibold text-center py-4" style={{ fontSize: '20px' }}>Quản lý chương trình học</p>

            <div className="border-b border-gray-300" />

            <div className="bg-white rounded-lg border border-[var(--border-color)] p-3 mx-4 mt-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <input
                        className="px-3 py-2 border border-gray-300 rounded bg-white text-sm outline-none text-gray-700 flex-1 min-w-[200px]"
                        placeholder="Tìm kiếm chương trình..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="px-3 py-2 border border-gray-300 rounded bg-white text-sm outline-none text-gray-700"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="">Tất cả loại</option>
                        {typeOptions.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    <button
                        className="px-4 py-2 rounded-lg font-medium cursor-pointer flex items-center gap-2 bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] text-sm"
                        onClick={reloadData}
                        disabled={isReloading}
                    >
                        {isReloading ? 'Đang tải...' : 'Làm mới dữ liệu'}
                    </button>
                    <CourseManagementPage availableTypes={typeOptions} typeCounts={typeCounts} onTypeDeleted={reloadData} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <ProgramList programs={filtered} />
            </div>

            {isReloading && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90">
                    <Loading content={<p className="text-sm font-normal text-white">Đang tải dữ liệu...</p>} />
                </div>
            )}
        </div>
    )
}
