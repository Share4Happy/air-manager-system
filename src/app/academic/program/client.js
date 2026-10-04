'use client'

import { useState, useMemo } from 'react'
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

    const typeOptions = useMemo(() => [...new Set(programs.map(p => p.Type).filter(Boolean))], [programs])
    const typeCounts = useMemo(() => {
        const counts = {}
        programs.forEach(p => { if (p.Type) counts[p.Type] = (counts[p.Type] || 0) + 1 })
        return counts
    }, [programs])

    const filtered = programs.filter(p => {
        if (search.trim() && !p.Name?.toLowerCase().includes(search.toLowerCase()) && !p.ID?.toLowerCase().includes(search.toLowerCase())) return false
        if (typeFilter && p.Type !== typeFilter) return false
        return true
    })

    const hasActiveFilters = Boolean(typeFilter)

    return (
        <div className="h-full flex flex-col min-h-0 p-0 gap-2">
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
                        <select
                            className="h-9 px-3 border border-gray-300 rounded-lg bg-white text-xs sm:text-sm outline-none text-[var(--text-primary)] focus:border-[var(--main_d)] transition-colors cursor-pointer"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="">Tất cả phân loại</option>
                            {typeOptions.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>

                        <div className="h-9 px-3 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium border border-gray-200 whitespace-nowrap flex items-center gap-1.5 shrink-0">
                            <span>Tổng:</span>
                            <span className="font-semibold text-[var(--text-primary)]">{filtered.length}</span>
                        </div>

                        <button
                            className="h-9 px-3 rounded-lg font-medium cursor-pointer flex items-center gap-2 bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] text-xs sm:text-sm hover:bg-[#f1f5f9] transition-colors whitespace-nowrap"
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
                            className="h-9 px-3 border border-gray-300 rounded-lg bg-white text-xs sm:text-sm outline-none text-[var(--text-primary)] focus:border-[var(--main_d)] transition-colors cursor-pointer w-full"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="">Tất cả phân loại</option>
                            {typeOptions.map(t => (
                                <option key={t} value={t}>{t}</option>
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

