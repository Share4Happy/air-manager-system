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
        <div className="h-full flex flex-col min-h-0">
            <div className="py-3 sm:py-4 px-3 sm:px-4 flex items-center justify-between">
                <p className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Quản lý chương trình học</p>
                <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-normal">
                    Tổng: {filtered.length} chương trình
                </span>
            </div>

            <div className="border-b border-gray-200" />

            <div className="bg-white rounded-lg border border-[var(--border-color)] p-2.5 sm:p-3 mx-2 sm:mx-4 mt-2 sm:mt-3 shadow-sm">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-wrap">
                    <input
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm outline-none text-gray-700 flex-1 min-w-0"
                        placeholder="Tìm kiếm chương trình hoặc mã..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm outline-none text-gray-700 flex-1 sm:flex-none cursor-pointer"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="">Tất cả loại</option>
                            {typeOptions.map(t => (
                                <option key={t} value={t}>{t} ({typeCounts[t] || 0})</option>
                            ))}
                        </select>
                        <button
                            className="px-3 sm:px-4 py-2 rounded-lg font-medium cursor-pointer flex items-center justify-center gap-1.5 bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] text-sm hover:bg-[#f1f5f9] transition-colors whitespace-nowrap"
                            onClick={reloadData}
                            disabled={isReloading}
                        >
                            {isReloading ? 'Đang tải...' : 'Làm mới'}
                        </button>
                        <div className="w-full sm:w-auto">
                            <CourseManagementPage availableTypes={typeOptions} typeCounts={typeCounts} onTypeDeleted={reloadData} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                <ProgramList programs={filtered} />
            </div>

            {isReloading && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80">
                    <Loading content={<p className="text-sm font-normal text-white">Đang tải dữ liệu...</p>} />
                </div>
            )}
        </div>
    )
}
