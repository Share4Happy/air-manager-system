'use client'
import { useState, useMemo } from 'react'
import CreateArea from '@/app/course/ui/createarea'
import ListArea from '@/app/course/ui/area-item'

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
    <div className="p-4 flex flex-col gap-4 h-full overflow-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-[var(--text-secondary)]">
            {areas.length} khu vực · {totalRooms} phòng học
          </p>
        </div>
        <CreateArea />
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill="var(--text-secondary)">
          <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
        </svg>
        <input
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700"
          placeholder="Tìm khu vực hoặc phòng học..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length > 0 ? (
        <ListArea programs={filtered} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
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
