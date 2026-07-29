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
    const [error, setError] = useState('')
    const [sizes, setSizes] = useState({})

    useEffect(() => {
        fetch('/api/drive-storage')
            .then(r => r.json())
            .then(d => {
                setData(d)
                setLoading(false)
                d.courseFolders?.forEach(f => {
                    fetch(`/api/drive-storage/size?id=${f.id}`)
                        .then(r => r.json())
                        .then(info => setSizes(prev => ({ ...prev, [f.id]: info })))
                        .catch(() => {})
                })
            })
            .catch(e => { setError(e.message); setLoading(false) })
    }, [])

    if (loading) return <div className="h-full overflow-auto p-4"><p className="text-gray-400 text-center pt-8">Đang tải...</p></div>
    if (error) return <div className="h-full overflow-auto p-4"><p className="text-red-500 text-center pt-8">Lỗi: {error}</p></div>
    if (!data) return null

    const totalWithSize = Object.keys(sizes).reduce((a, id) => a + (sizes[id]?.totalSize || 0), 0)
    const totalWithFiles = Object.keys(sizes).reduce((a, id) => a + (sizes[id]?.fileCount || 0), 0)

    return (
        <div className="h-full overflow-auto p-4">
            <h1 className="text-lg font-semibold mb-1">Dung lượng Google Drive</h1>
            <p className="text-sm text-gray-500 mb-4">{data.driveName} — {data.totalCourses} khóa học</p>

            {Object.keys(sizes).length > 0 && (
                <div className="flex flex-wrap gap-4 mb-4">
                    <div className="bg-white border rounded-lg p-4 flex-1 min-w-[160px]">
                        <p className="text-xs text-gray-500 uppercase">Đã tính</p>
                        <p className="text-xl font-bold mt-1">{formatBytes(totalWithSize)}</p>
                    </div>
                    <div className="bg-white border rounded-lg p-4 flex-1 min-w-[160px]">
                        <p className="text-xs text-gray-500 uppercase">Số file</p>
                        <p className="text-xl font-bold mt-1">{totalWithFiles}</p>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="px-3 py-2 border-b font-medium text-gray-600">Mã khóa học</th>
                            <th className="px-3 py-2 border-b font-medium text-gray-600">Dung lượng</th>
                            <th className="px-3 py-2 border-b font-medium text-gray-600">Số file</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.courseFolders.map(f => {
                            const info = sizes[f.id]
                            return (
                                <tr key={f.id} className="hover:bg-gray-50 border-b">
                                    <td className="px-3 py-2 font-medium">{f.name}</td>
                                    <td className="px-3 py-2">{info ? formatBytes(info.totalSize) : <span className="text-gray-300 italic">đang tính...</span>}</td>
                                    <td className="px-3 py-2">{info ? info.fileCount : <span className="text-gray-300 italic">đang tính...</span>}</td>
                                </tr>
                            )
                        })}
                        {data.courseFolders.length === 0 && (
                            <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-400 italic">Chưa có khóa học nào</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
