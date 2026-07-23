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

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-[13px] py-3 border-b border-[var(--border-color)]">
                <h1 className="text-xl font-semibold">Quản lý chương trình học</h1>
                <div className="flex gap-2">
                    <button
                        className="px-4 py-2.5 rounded-lg font-medium cursor-pointer flex items-center gap-2 bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] text-sm"
                        onClick={reloadData}
                        disabled={isReloading}
                    >
                        {isReloading ? 'Đang tải...' : 'Làm mới dữ liệu'}
                    </button>
                    <CourseManagementPage />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-[16px_3px] m-[0_-3px] box-border">
                <ProgramList programs={programs} />
            </div>
            {isReloading && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90">
                    <Loading content={<p className="text-sm font-normal text-white">Đang tải dữ liệu...</p>} />
                </div>
            )}
        </div>
    )
}
