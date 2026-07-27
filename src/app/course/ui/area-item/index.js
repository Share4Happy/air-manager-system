'use client'

import React, { useState, useEffect } from 'react'
import CenterPopup from '@/components/(features)/(popup)/popup_center'
import Noti from '@/components/(features)/(noti)/noti'
import Loading from '@/components/(ui)/(loading)/loading'
import { useRouter } from 'next/navigation'

const AreaCard = ({ area, onClick }) => (
  <div
    className="bg-white border border-gray-200 rounded-xl cursor-pointer overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    onClick={() => onClick(area)}
  >
    <div className="h-2" style={{ background: area.color || '#ccc' }} />
    <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-[var(--text-primary)] truncate">{area.name}</h3>
        <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white" style={{ background: area.color || '#ccc' }}>
          {area.rooms?.length || 0}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {(area.rooms || []).slice(0, 4).map(r => (
          <span key={r._id || r.name} className="px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-600 border border-gray-200">
            {r.name}
          </span>
        ))}
        {(area.rooms || []).length > 4 && (
          <span className="px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-400 border border-gray-200">
            +{area.rooms.length - 4}
          </span>
        )}
      </div>
    </div>
  </div>
)

export default function ProgramList({ programs = [] }) {
  const router = useRouter()
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ name: '', color: '#000000', rooms: [] })
  const [newRoom, setNewRoom] = useState('')
  const [colorErr, setColorErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [noti, setNoti] = useState({ open: false, status: false, mes: '' })

  const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v)

  useEffect(() => {
    if (!selected) return
    setForm({
      name: selected.name,
      color: selected.color || '#000000',
      rooms: selected.rooms || []
    })
    setColorErr('')
  }, [selected])

  const addRoom = () => {
    const n = newRoom.trim()
    if (!n || form.rooms.some(r => r.name === n)) return
    setForm(f => ({ ...f, rooms: [...f.rooms, { name: n }] }))
    setNewRoom('')
  }

  const delRoom = (name) =>
    setForm(f => ({ ...f, rooms: f.rooms.filter(r => r.name !== name) }))

  const save = async () => {
    if (!form.name.trim() || !isHex(form.color)) {
      setNoti({ open: true, status: false, mes: 'Vui lòng kiểm tra dữ liệu.' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/area/${selected._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          color: form.color,
          rooms: form.rooms
        })
      }).then(r => r.json())

      setNoti({ open: true, status: res.status, mes: res.mes })
      if (res.status) router.refresh()
      setSelected(null)
    } catch (e) {
      setNoti({ open: true, status: false, mes: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {programs.length ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {programs.map(a => (
            <AreaCard key={a._id} area={a} onClick={setSelected} />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center py-12">
          <p className="text-sm text-[var(--text-secondary)] italic">Không có khu vực nào.</p>
        </div>
      )}

      <CenterPopup
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Chi tiết khu vực` : ''}
        size="md"
      >
        {selected && (
          <div className="p-5 flex flex-col gap-5">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: form.color || '#ccc' }}>
                {form.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{form.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{form.rooms.length} phòng học</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên khu vực</label>
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 focus:border-[var(--main_d)] transition-colors"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Màu hiển thị</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setForm({ ...form, color: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
                <input
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 focus:border-[var(--main_d)] transition-colors"
                  value={form.color.toUpperCase()}
                  onChange={e => {
                    setForm({ ...form, color: e.target.value })
                    setColorErr(isHex(e.target.value) ? '' : 'Mã màu HEX không hợp lệ.')
                  }}
                />
              </div>
              {colorErr && <p className="text-xs text-red-500">{colorErr}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phòng học</label>
              <div className="flex flex-wrap gap-2">
                {form.rooms.map(r => (
                  <span key={r._id || r.name} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {r.name}
                    <button onClick={() => delRoom(r.name)} className="text-blue-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer p-0 text-sm leading-none">&times;</button>
                  </span>
                ))}
                {form.rooms.length === 0 && (
                  <span className="text-xs text-gray-400 italic">Chưa có phòng học nào</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 focus:border-[var(--main_d)] transition-colors"
                  placeholder="Nhập tên phòng..."
                  value={newRoom}
                  onChange={e => setNewRoom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addRoom()}
                />
                <button
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium border-none cursor-pointer whitespace-nowrap hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--main_d)' }}
                  onClick={addRoom}
                >
                  Thêm
                </button>
              </div>
            </div>

            <button
              className="w-full py-2.5 rounded-lg text-white text-sm font-medium border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: 'var(--green)' }}
              onClick={save}
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        )}
      </CenterPopup>

      {loading && (
        <div className="fixed inset-0 bg-black/30 z-[9999] flex items-center justify-center">
          <Loading content="Đang cập nhật..." />
        </div>
      )}

      <Noti
        open={noti.open}
        onClose={() => setNoti(n => ({ ...n, open: false }))}
        status={noti.status}
        mes={noti.mes}
        button={
          <button
            className="px-4 py-2 rounded text-white text-sm font-medium border-none cursor-pointer"
            style={{ background: 'var(--main_d)' }}
            onClick={() => setNoti(n => ({ ...n, open: false }))}
          >
            Đóng
          </button>
        }
      />
    </>
  )
}
