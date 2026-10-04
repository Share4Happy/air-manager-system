'use client'
import { useState, useMemo } from 'react'
import CreateArea from '@/app/course/ui/createarea'
import ListArea from '@/app/course/ui/area-item'
import Toolbar from '@/components/(ui)/(toolbar)'

export default function RoomManager({ areas }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return areas
    const q = search.toLowerCase()
    return areas.filter(a =>
      a.name?.toLowerCase().includes(q) ||
      a.rooms?.some(r => r.name?.toLowerCase().includes(q))
    )
  }, [areas, search])

  const totalRooms = areas.reduce((s, a) => s + (a.rooms?.length || 0), 0)

  return (
    <div className="h-full flex flex-col min-h-0 p-0 gap-2 overflow-auto">
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm khu vực hoặc phòng học..."
        hasFilters={false}
        mobileActions={
          <CreateArea />
        }
        desktopActions={
          <>
            <div className="h-9 px-3 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium border border-gray-200 whitespace-nowrap flex items-center gap-1.5 shrink-0">
              <span>Tổng:</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {areas.length} khu vực · {totalRooms} phòng học
              </span>
            </div>
            <CreateArea />
          </>
        }
      />

      {filtered.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          <ListArea programs={filtered} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <svg className="mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width={48} height={48} fill="var(--text-secondary)">
              <path d="M48 0C21.5 0 0 21.5 0 48V464c0 26.5 21.5 48 48 48H592c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48H48zM64 64H576V416H64V64zM128 96v64H384V96H128zm256 0v64H512V96H384zM128 192v64H384V192H128zm256 0v64H512V192H384zM128 288v64H384V288H128zm256 0v64H512V288H384z"/>
            </svg>
            <p className="text-sm text-[var(--text-secondary)]">Không tìm thấy khu vực nào</p>
          </div>
        </div>
      )}
    </div>
  )
}
