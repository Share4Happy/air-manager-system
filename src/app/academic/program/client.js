'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProgramList from '@/app/course/ui/book-item'
import CourseManagementPage from '@/app/course/ui/createbook'
import Loading from '@/components/(ui)/(loading)/loading'
import Toolbar from '@/components/(ui)/(toolbar)'
import { reloadBook } from '@/data/actions/reload'
import { Svg_Reload } from '@/components/(icon)/svg'

export default function ProgramClient({ programs }) {
    const router = useRouter()
    const [isReloading, setIsReloading] = useState(false)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [showFilters, setShowFilters] = useState(false)

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

    const hasActiveFilters = Boolean(typeFilter)

    return (
        <div className="h-full flex flex-col min-h-0 p-2">
            <div>
                <Toolbar
                    search={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Tìm kiếm chương trình hoặc mã..."
                    showFilters={showFilters}
                    onToggleFilters={() => setShowFilters(s => !s)}
                    hasActiveFilters={hasActiveFilters}
                    mobileActions={
                        <CourseManagementPage availableTypes={typeOptions} typeCounts={typeCounts} onTypeDeleted={reloadData} />
                    }
                    desktopActions={
                        <>
                            <div className="p-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200 whitespace-nowrap flex items-center gap-1.5 shrink-0">
                                <span>Tổng:</span>
                                <span className="font-semibold text-[var(--text-primary)]">{filtered.length}</span>
                            </div>

                            <select
                                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 w-auto cursor-pointer"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="">Tất cả loại</option>
                                {typeOptions.map(t => (
                                    <option key={t} value={t}>{t} ({typeCounts[t] || 0})</option>
                                ))}
                            </select>

                            <button
                                className="px-3 py-2 rounded-lg font-medium cursor-pointer flex items-center gap-2 bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] text-sm hover:bg-[#f1f5f9] transition-colors whitespace-nowrap"
                                onClick={reloadData}
                                disabled={isReloading}
                            >
                                <Svg_Reload w={16} h={16} c="currentColor" />
                                <span>{isReloading ? 'Đang tải...' : 'Làm mới'}</span>
                            </button>

                            <CourseManagementPage availableTypes={typeOptions} typeCounts={typeCounts} onTypeDeleted={reloadData} />
                        </>
                    }
                    mobileFilters={
                        <div className="flex flex-col gap-2 w-full">
                            <select
                                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 w-full"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="">Tất cả loại</option>
                                {typeOptions.map(t => (
                                    <option key={t} value={t}>{t} ({typeCounts[t] || 0})</option>
                                ))}
                            </select>

                            <div className="flex items-center gap-2 w-full pt-1">
                                <div className="px-2.5 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 shrink-0">
                                    Tổng: {filtered.length}
                                </div>
                                <button
                                    className="flex-1 px-3 py-2 rounded-lg font-medium cursor-pointer flex items-center justify-center gap-1.5 bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] text-xs"
                                    onClick={reloadData}
                                    disabled={isReloading}
                                >
                                    <Svg_Reload w={14} h={14} c="currentColor" />
                                    <span>{isReloading ? 'Đang tải...' : 'Làm mới'}</span>
                                </button>
                            </div>
                        </div>
                    }
                />
            </div>

            <div className="flex-1 overflow-y-auto p-2">
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

