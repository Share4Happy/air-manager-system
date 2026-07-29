'use client'

import { useState, useRef } from 'react'
import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import Noti from '@/components/(features)/(noti)/noti'
import Loading from '@/components/(ui)/(loading)/loading'
import { Svg_Add } from '@/components/(icon)/svg'

export default function ImportStudent() {
    const [isPopupOpen, setIsPopupOpen] = useState(false)
    const [file, setFile] = useState(null)
    const [dragging, setDragging] = useState(false)
    const [loading, setLoading] = useState(false)
    const [noti, setNoti] = useState({ open: false, status: false, mes: '' })
    const [errors, setErrors] = useState([])
    const fileRef = useRef(null)

    const handleDownload = () => {
        window.open('/api/student/import', '_blank')
    }

    const handleFile = (f) => {
        if (!f) return
        const ext = f.name.split('.').pop().toLowerCase()
        if (!['xlsx', 'xls', 'csv'].includes(ext)) {
            setNoti({ open: true, status: false, mes: 'Vui lòng chọn file .xlsx, .xls hoặc .csv' })
            return
        }
        setFile(f)
    }

    const handleUpload = async () => {
        if (!file) return
        setLoading(true)
        setErrors([])
        try {
            const fd = new FormData()
            fd.append('file', file)
            const res = await fetch('/api/student/import', { method: 'POST', body: fd })
            const json = await res.json()
            if (json.status) {
                setNoti({ open: true, status: true, mes: json.mes })
                if (json.data?.errors?.length) setErrors(json.data.errors)
                setFile(null)
            } else {
                setNoti({ open: true, status: false, mes: json.mes })
            }
        } catch {
            setNoti({ open: true, status: false, mes: 'Lỗi kết nối máy chủ' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                className="px-3 py-2 bg-[var(--main_d)] text-white text-sm font-medium rounded cursor-pointer border-none flex items-center gap-1.5 whitespace-nowrap transition-colors hover:brightness-110"
                onClick={() => setIsPopupOpen(true)}
            >
                <Svg_Add w={16} h={16} c='white' />
                Import
            </button>

            <FlexiblePopup
                open={isPopupOpen}
                onClose={() => { setIsPopupOpen(false); setFile(null); setErrors([]) }}
                title="Import học sinh từ Excel"
                width={600}
                renderItemList={() => (
                    <div className="p-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[var(--text-primary)]">Tải file mẫu:</span>
                            <button
                                className="px-3 py-1.5 text-sm rounded bg-[var(--main_d)] text-white cursor-pointer border-none hover:brightness-110"
                                onClick={handleDownload}
                            >
                                Tải mẫu Excel
                            </button>
                        </div>

                        <div
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragging ? 'border-[var(--main_d)] bg-[var(--main_d)]/5' : 'border-[var(--border-color)]'}`}
                            onClick={() => fileRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
                        >
                            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                                onChange={(e) => handleFile(e.target.files[0])} />
                            {file ? (
                                <div className="flex flex-col gap-2 items-center">
                                    <span className="text-sm font-medium text-[var(--text-primary)]">{file.name}</span>
                                    <span className="text-xs text-[var(--text-secondary)]">{(file.size / 1024).toFixed(1)} KB</span>
                                    <button
                                        className="px-3 py-1 text-xs rounded bg-[var(--red)] text-white cursor-pointer border-none hover:brightness-110"
                                        onClick={(e) => { e.stopPropagation(); setFile(null) }}
                                    >
                                        Bỏ chọn
                                    </button>
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--text-secondary)]">Kéo thả file vào đây hoặc nhấn để chọn file</p>
                            )}
                        </div>

                        <button
                            className="px-4 py-2 rounded text-sm font-medium cursor-pointer border-none transition-colors whitespace-nowrap"
                            style={{
                                background: file ? 'var(--main_d)' : 'var(--border-color)',
                                color: file ? 'white' : 'var(--text-secondary)',
                            }}
                            disabled={!file || loading}
                            onClick={handleUpload}
                        >
                            {loading ? 'Đang xử lý...' : 'Import'}
                        </button>

                        {errors.length > 0 && (
                            <div className="mt-2">
                                <p className="text-sm font-medium text-[var(--red)] mb-1">Lỗi ({errors.length} dòng):</p>
                                <div className="max-h-40 overflow-y-auto text-xs text-[var(--red)] space-y-0.5">
                                    {errors.map((e, i) => (
                                        <p key={i}>Dòng {e.row}: {e.mes}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            />

            {loading && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[9999] backdrop-blur">
                    <Loading content={<p className='text-sm text-white'>Đang import...</p>} />
                </div>
            )}

            <Noti
                open={noti.open}
                status={noti.status}
                mes={noti.mes}
                onClose={() => setNoti(prev => ({ ...prev, open: false }))}
                button={
                    <div className="px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none mt-2 justify-center whitespace-nowrap" style={{ width: 'calc(100% - 24px)', justifyContent: 'center' }} onClick={() => setNoti(prev => ({ ...prev, open: false }))}>
                        <p className="text-sm text-white">Tắt thông báo</p>
                    </div>
                }
            />
        </>
    )
}
