'use client'

import { useState, useEffect } from 'react'

function formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function DriveStoragePage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [progress, setProgress] = useState(null)
    const [error, setError] = useState('')

    const loadData = () => {
        setLoading(true)
        setError('')
        fetch('/api/drive-storage/summary')
            .then(r => r.json())
            .then(d => {
                if (d.error) { setError(d.error); return }
                setData(d)
            })
            .catch(e => { setError(e.message) })
            .finally(() => setLoading(false))
    }

    useEffect(loadData, [])

    const handleRefresh = async () => {
        setRefreshing(true)
        setProgress({ current: 0, total: 1, label: 'Đang kết nối...' })
        setError('')

        try {
            const res = await fetch('/api/drive-storage/refresh', { method: 'POST' })
            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop()

                for (const line of lines) {
                    if (!line.trim()) continue
                    try {
                        const msg = JSON.parse(line)
                        if (msg.type === 'progress') {
                            setProgress({ current: msg.current, total: msg.total, label: msg.label })
                        } else if (msg.type === 'done') {
                            setData(msg.data)
                            setProgress(null)
                            setRefreshing(false)
                        } else if (msg.type === 'error') {
                            setError(msg.message)
                            setProgress(null)
                            setRefreshing(false)
                        }
                    } catch { }
                }
            }
        } catch (e) {
            setError(e.message)
            setProgress(null)
            setRefreshing(false)
        }
    }

    if (loading) return <div className="h-full overflow-auto p-4"><p className="text-gray-400 text-center pt-8">Đang tải...</p></div>
    if (error) return <div className="h-full overflow-auto p-4"><p className="text-red-500 text-center pt-8">Lỗi: {error}</p></div>
    if (!data) return null

    const { summary, courses, updated, lastUpdated } = data
    const progressPct = progress ? Math.round((progress.current / progress.total) * 100) : 0

    return (
        <div className="h-full overflow-auto p-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-lg font-semibold">Dung lượng Google Drive</h1>
                    <p className="text-sm text-gray-500">
                        Danh sách từ Drive — {courses?.length || 0} thư mục
                        {lastUpdated && <> · Cập nhật: {new Date(lastUpdated).toLocaleString('vi-VN')}</>}
                    </p>
                </div>
                <button onClick={handleRefresh} disabled={refreshing}
                    className="px-4 py-2 bg-[var(--main_d)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 cursor-pointer border-none flex items-center gap-2 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill="currentColor"
                        className={refreshing ? 'animate-spin' : ''}>
                        <path d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 352 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l111.5 0c0 0 0 0 0 0l.8 0c13.2 0 24-10.8 24-24l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 432c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c0 0 0 0 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.8c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352l34.4 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z"/>
                    </svg>
                    {refreshing ? 'Đang đồng bộ...' : 'Làm mới từ Drive'}
                </button>
            </div>

            {refreshing && progress && (
                <div className="bg-white border rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">{progress.label}</p>
                        <p className="text-xs text-gray-400">{progressPct}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-[var(--main_d)] h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }} />
                    </div>
                </div>
            )}

            {updated !== undefined && !refreshing && (
                <p className="text-xs text-green-600 mb-3">Đã đồng bộ {updated} file từ Google Drive.</p>
            )}

            <div className="flex flex-wrap gap-4 mb-4">
                <div className="bg-white border rounded-lg p-4 flex-1 min-w-[160px]">
                    <p className="text-xs text-gray-500 uppercase">Tổng dung lượng</p>
                    <p className="text-xl font-bold mt-1">{summary ? formatBytes(summary.totalSize) : '0 B'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{summary ? summary.totalFiles.toLocaleString() : 0} file</p>
                </div>
                <div className="bg-white border rounded-lg p-4 flex-1 min-w-[160px]">
                    <p className="text-xs text-gray-500 uppercase">Hình ảnh</p>
                    <p className="text-xl font-bold mt-1">{summary ? formatBytes(summary.imageSize) : '0 B'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{summary ? summary.imageFiles.toLocaleString() : 0} file</p>
                </div>
                <div className="bg-white border rounded-lg p-4 flex-1 min-w-[160px]">
                    <p className="text-xs text-gray-500 uppercase">Video</p>
                    <p className="text-xl font-bold mt-1">{summary ? formatBytes(summary.videoSize) : '0 B'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{summary ? summary.videoFiles.toLocaleString() : 0} file</p>
                </div>
                <div className="bg-white border rounded-lg p-4 flex-1 min-w-[160px]">
                    <p className="text-xs text-gray-500 uppercase">Avatar + Book</p>
                    <p className="text-xl font-bold mt-1">{summary ? formatBytes((summary.avatarSize || 0) + (summary.bookSize || 0)) : '0 B'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{summary ? ((summary.avatarFiles || 0) + (summary.bookFiles || 0)).toLocaleString() : 0} file</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="px-3 py-2 border-b font-medium text-gray-600">Mã khóa học</th>
                            <th className="px-3 py-2 border-b font-medium text-gray-600">Hình ảnh</th>
                            <th className="px-3 py-2 border-b font-medium text-gray-600">Video</th>
                            <th className="px-3 py-2 border-b font-medium text-gray-600">Tổng</th>
                            <th className="px-3 py-2 border-b font-medium text-gray-600">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses?.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50 border-b">
                                <td className="px-3 py-2 font-medium">{c.name}</td>
                                <td className="px-3 py-2">
                                    <span className="font-medium">{formatBytes(c.imageSize || 0)}</span>
                                    <span className="text-gray-400 ml-1">({(c.imageFiles || 0).toLocaleString()} file)</span>
                                </td>
                                <td className="px-3 py-2">
                                    <span className="font-medium">{formatBytes(c.videoSize || 0)}</span>
                                    <span className="text-gray-400 ml-1">({(c.videoFiles || 0).toLocaleString()} file)</span>
                                </td>
                                <td className="px-3 py-2">
                                    <span className="font-medium">{formatBytes(c.totalSize || 0)}</span>
                                    <span className="text-gray-400 ml-1">({(c.totalFiles || 0).toLocaleString()} file)</span>
                                </td>
                                <td className="px-3 py-2">
                                    {c.inMongo ? (
                                        <span className="text-xs text-green-600 font-medium">Đã đồng bộ</span>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Chưa có dữ liệu</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {(!courses || courses.length === 0) && (
                            <tr><td colSpan={5} className="px-3 py-4 text-center text-gray-400 italic">Chưa có thư mục nào</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
