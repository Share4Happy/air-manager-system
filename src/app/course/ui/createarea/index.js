'use client'

import React, { useState } from 'react'
import CenterPopup from '@/components/(features)/(popup)/popup_center'
import Noti from '@/components/(features)/(noti)/noti'
import { useRouter } from 'next/navigation'
import Loading from '@/components/(ui)/(loading)/loading'

const CreateArea = () => {
  const router = useRouter()
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [notification, setNotification] = useState({ open: false, status: false, mes: '' })
  const [form, setForm] = useState({ name: '', color: '#00D097', rooms: [] })
  const [newRoom, setNewRoom] = useState('')
  const [colorError, setColorError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validateHexColor = (hex) => /^#[0-9a-fA-F]{6}$/.test(hex)

  const openPopup = () => {
    setForm({ name: '', color: '#00D097', rooms: [] })
    setColorError('')
    setNewRoom('')
    setIsPopupOpen(true)
  }

  const addRoom = () => {
    const trimmed = newRoom.trim()
    if (trimmed && !form.rooms.includes(trimmed)) {
      setForm(prev => ({ ...prev, rooms: [...prev.rooms, trimmed] }))
      setNewRoom('')
    }
  }

  const create = async () => {
    if (!form.name.trim()) {
      setNotification({ open: true, status: false, mes: 'Tên khu vực không được để trống.' })
      return
    }
    if (colorError) {
      setNotification({ open: true, status: false, mes: 'Vui lòng sửa định dạng màu sắc.' })
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/area', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (result.status) {
        router.refresh()
        setNotification({ open: true, status: true, mes: result.mes || 'Tạo khu vực thành công' })
      } else {
        setNotification({ open: true, status: false, mes: result.mes || 'Lỗi tạo khu vực' })
      }
      setIsPopupOpen(false)
    } catch (error) {
      setNotification({ open: true, status: false, mes: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        className="px-4 py-2 rounded-lg text-white text-sm font-medium border-none cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity"
        style={{ background: 'var(--main_d)' }}
        onClick={openPopup}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={14} height={14} fill="white">
          <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/>
        </svg>
        Thêm khu vực
      </button>

      <CenterPopup open={isPopupOpen} onClose={() => setIsPopupOpen(false)} title="Thêm khu vực mới" size="sm">
        <div className="p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên khu vực</label>
            <input
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none text-gray-700 focus:border-[var(--main_d)] transition-colors"
              placeholder="VD: Khu A, Tầng 2..."
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
                  setColorError(validateHexColor(e.target.value) ? '' : 'Mã màu HEX không hợp lệ.')
                }}
              />
            </div>
            {colorError && <p className="text-xs text-red-500">{colorError}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phòng học</label>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {form.rooms.map((room, index) => (
                <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {room}
                  <button onClick={() => setForm(prev => ({ ...prev, rooms: prev.rooms.filter(r => r !== room) }))} className="text-blue-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer p-0 text-sm leading-none">&times;</button>
                </span>
              ))}
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
            className="w-full py-2.5 rounded-lg text-white text-sm font-medium border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            style={{ background: 'var(--green)' }}
            onClick={create}
            disabled={isLoading}
          >
            {isLoading ? 'Đang tạo...' : 'Tạo khu vực'}
          </button>
        </div>
      </CenterPopup>

      {isLoading && (
        <div className="fixed inset-0 bg-black/30 z-[9999] flex items-center justify-center">
          <Loading content="Đang tạo khu vực..." />
        </div>
      )}

      <Noti
        open={notification.open}
        onClose={() => setNotification({ ...notification, open: false })}
        status={notification.status}
        mes={notification.mes}
        button={
          <button
            className="px-4 py-2 rounded text-white text-sm font-medium border-none cursor-pointer"
            style={{ background: 'var(--main_d)' }}
            onClick={() => setNotification({ ...notification, open: false })}
          >
            Đóng
          </button>
        }
      />
    </>
  )
}

export default CreateArea
