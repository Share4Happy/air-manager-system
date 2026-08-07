'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Noti from '@/components/(features)/(noti)/noti'
import { defaultAvatarUrl } from '@/function'

function ZaloTab({ zaloAccounts, users }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [proxyVal, setProxyVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [noti, setNoti] = useState({ open: false, status: false, message: '' })

  const filtered = useMemo(() => {
    if (!search.trim()) return zaloAccounts
    const q = search.toLowerCase()
    return zaloAccounts.filter(a =>
      a.name?.toLowerCase().includes(q) || a.phone?.includes(q) || a.uid?.toLowerCase().includes(q)
    )
  }, [zaloAccounts, search])

  const getUserName = (userId) => {
    const u = users.find(u => u._id === userId)
    return u?.name || userId
  }

  const startEdit = (account) => {
    setEditing(account._id)
    setProxyVal(account.proxy || '')
  }

  const cancelEdit = () => {
    setEditing(null)
    setProxyVal('')
  }

  const saveProxy = async (id) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/zalo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxy: proxyVal }),
      })
      const json = await res.json()
      if (json.success) {
        setNoti({ open: true, status: true, message: 'Đã lưu proxy' })
        setEditing(null)
        router.refresh()
      } else {
        setNoti({ open: true, status: false, message: json.error || 'Lỗi' })
      }
    } catch (e) {
      setNoti({ open: true, status: false, message: 'Lỗi kết nối' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm tài khoản Zalo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 w-72"
        />
        <span className="text-xs text-[var(--text-secondary)]">{filtered.length}/{zaloAccounts.length} tài khoản</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] mt-12">Không có tài khoản Zalo</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(account => (
              <div key={account._id} className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={account.avt || defaultAvatarUrl()}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                      onError={e => { e.target.onerror = null; e.target.src = defaultAvatarUrl() }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{account.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{account.phone} · {account.uid}</p>
                      {account.roles?.length > 0 && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          Người dùng: {account.roles.map(r => getUserName(r)).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 max-w-md">
                    {editing === account._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={proxyVal}
                          onChange={e => setProxyVal(e.target.value)}
                          placeholder="http://user:pass@host:port"
                          className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded bg-white outline-none text-gray-700 font-mono"
                        />
                        <button onClick={() => saveProxy(account._id)} disabled={saving}
                          className="px-2 py-1.5 text-xs font-medium text-white bg-[var(--main_d)] rounded hover:opacity-90 disabled:opacity-40">
                          {saving ? '...' : 'Lưu'}
                        </button>
                        <button onClick={cancelEdit}
                          className="px-2 py-1.5 text-xs font-medium text-[var(--text-secondary)] bg-gray-100 rounded hover:bg-gray-200">
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded text-gray-600 truncate font-mono">
                          {account.proxy || <span className="text-gray-400 italic">Chưa cấu hình proxy</span>}
                        </code>
                        <button onClick={() => startEdit(account)}
                          className="px-2 py-1.5 text-xs font-medium text-[var(--main_d)] hover:bg-[var(--main_l)] rounded shrink-0">
                          {account.proxy ? 'Sửa' : 'Thêm'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.message}
        button={<button onClick={() => setNoti(p => ({ ...p, open: false }))}
          className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2">Đóng</button>} />
    </>
  )
}

function DriveVerifyTab() {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [noti, setNoti] = useState({ open: false, status: false, message: '' })

  const handleVerify = async () => {
    setRunning(true)
    setProgress({ current: 0, total: 1, label: 'Đang kết nối...' })
    setResult(null)
    setError('')

    try {
      const res = await fetch('/api/drive-storage/verify', { method: 'POST' })
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
              setResult(msg.data)
              setProgress(null)
              setRunning(false)
              setNoti({ open: true, status: true, message: `Xong: ${msg.data.summary.ok} OK · ${msg.data.summary.moved} di chuyển · ${msg.data.summary.renamed} đổi tên · ${msg.data.summary.recreated} tạo mới · ${msg.data.summary.failed} lỗi` })
            } else if (msg.type === 'error') {
              setError(msg.message)
              setProgress(null)
              setRunning(false)
            }
          } catch { }
        }
      }
    } catch (e) {
      setError(e.message)
      setProgress(null)
      setRunning(false)
    }
  }

  const summary = result?.summary
  const progressPct = progress && progress.total ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Đồng bộ cấu trúc thư mục Drive theo chuẩn: folder lớp
        <code className="mx-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs">MãLớp</code> (vd 24FZ2007) và folder buổi
        <code className="mx-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs">MãLớp-YYYY-MM-DD</code> nằm bên trong lớp.
        Thư mục bị thùng rác sẽ được khôi phục, thư mục ở sai vị trí sẽ được di chuyển vào đúng lớp, đổi tên theo chuẩn;
        thư mục ở drive cũ / không tồn tại sẽ được tạo mới trong
        <code className="mx-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs">DRIVE_COURSE_FOLDER_ID</code> và cập nhật lại DB.
      </p>

      <button onClick={handleVerify} disabled={running}
        className="px-4 py-2 bg-[var(--main_d)] text-white text-sm font-medium rounded hover:opacity-90 disabled:opacity-40 cursor-pointer border-none">
        {running ? 'Đang đồng bộ...' : 'Đồng bộ cấu trúc Drive'}
      </button>

      {running && progress && (
        <div className="bg-white border rounded-lg p-4 mt-4">
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

      {error && <p className="text-sm text-red-500 mt-4">Lỗi: {error}</p>}

      {summary && !running && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { label: 'Tổng', value: summary.total, color: 'text-gray-700' },
              { label: 'OK', value: summary.ok, color: 'text-green-600' },
              { label: 'Khôi phục', value: summary.restored, color: 'text-blue-600' },
              { label: 'Di chuyển', value: summary.moved, color: 'text-cyan-600' },
              { label: 'Đổi tên', value: summary.renamed, color: 'text-yellow-600' },
              { label: 'Tạo mới', value: summary.recreated, color: 'text-orange-600' },
              { label: 'Tạo lớp', value: summary.createdClass, color: 'text-teal-600' },
              { label: 'Sửa DB', value: summary.dbUpdated, color: 'text-purple-600' },
              { label: 'Lỗi', value: summary.failed, color: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="bg-white border rounded-lg p-3 flex-1 min-w-[90px] text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {result.details?.length > 0 && (
            <div className="max-h-72 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-left">
                    <th className="px-3 py-2 border-b font-medium text-gray-600">Khóa học</th>
                    <th className="px-3 py-2 border-b font-medium text-gray-600">Folder cũ</th>
                    <th className="px-3 py-2 border-b font-medium text-gray-600">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {result.details.map((d, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-3 py-2 font-medium">{d.name}</td>
                      <td className="px-3 py-2">
                        <code className="text-xs text-gray-500">{d.folderId}</code>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-medium ${d.action === 'ok' ? 'text-green-600' : d.action === 'restored' ? 'text-blue-600' : d.action === 'recreated' ? 'text-orange-600' : d.action === 'moved' ? 'text-cyan-600' : d.action === 'renamed' ? 'text-yellow-600' : 'text-red-600'}`}>
                          {d.action}
                        </span>
                        {d.newId && <div className="text-xs text-gray-400 mt-0.5">→ <code>{d.newId}</code></div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.message}
        button={<button onClick={() => setNoti(p => ({ ...p, open: false }))}
          className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2">Đóng</button>} />
    </div>
  )
}

function SlaTab() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noti, setNoti] = useState({ open: false, status: false, message: '' })

  const LABELS = {
    sla_reminder_minutes: 'Nhắc nhở điểm danh (phút)',
    sla_warning_minutes: 'Cảnh báo nhật ký (phút)',
    sla_resource_warning_minutes: 'Cảnh báo minh chứng (phút)',
    sla_incident_minutes: 'Vi phạm SLA (phút)',
    student_absent_threshold: 'Ngưỡng vắng học sinh',
  }

  const DESCRIPTIONS = {
    sla_reminder_minutes: 'Sau bao nhiêu phút kết thúc buổi học thì nhắc giáo viên điểm danh',
    sla_warning_minutes: 'Sau bao nhiêu phút thì cảnh báo thiếu nhật ký buổi học',
    sla_resource_warning_minutes: 'Sau bao nhiêu phút thì cảnh báo thiếu minh chứng (ảnh/video)',
    sla_incident_minutes: 'Sau bao nhiêu phút thì ghi nhận vi phạm SLA',
    student_absent_threshold: 'Số buổi vắng tối đa trước khi cảnh báo',
  }

  useEffect(() => {
    fetch('/api/notifications/settings')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const map = {}
          json.data.forEach(s => { map[s.key] = s.value })
          setSettings(map)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (key, val) => {
    setSettings(p => ({ ...p, [key]: Number(val) }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const entries = Object.entries(settings).filter(([k]) => LABELS[k])
      const res = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: entries.map(([key, value]) => ({ key, value })) }),
      })
      const json = await res.json()
      setNoti({ open: true, status: json.success, message: json.success ? 'Đã lưu cấu hình SLA' : json.error })
    } catch (e) {
      setNoti({ open: true, status: false, message: 'Lỗi kết nối' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-32 text-sm text-[var(--text-secondary)]">Đang tải...</div>

  return (
    <div className="max-w-xl">
      <p className="text-sm text-[var(--text-secondary)] mb-4">Cấu hình thời gian cảnh báo SLA cho từng giai đoạn sau khi buổi học kết thúc.</p>
      <div className="flex flex-col gap-4">
        {Object.keys(LABELS).map(key => (
          <div key={key}>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">{LABELS[key]}</label>
            <p className="text-xs text-[var(--text-secondary)] mb-1">{DESCRIPTIONS[key]}</p>
            <input type="number" min={0} value={settings[key] ?? ''}
              onChange={e => handleChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700" />
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving}
        className="mt-6 px-4 py-2 bg-[var(--main_d)] text-white text-sm font-medium rounded hover:opacity-90 disabled:opacity-40 cursor-pointer border-none">
        {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
      </button>
      <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.message}
        button={<button onClick={() => setNoti(p => ({ ...p, open: false }))}
          className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2">Đóng</button>} />
    </div>
  )
}

function ZaloLiteTab() {
  const [form, setForm] = useState({ baseUrl: '', apiKey: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noti, setNoti] = useState({ open: false, status: false, message: '' })

  useEffect(() => {
    fetch('/api/notifications/settings')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const map = {}
          json.data.forEach(s => { map[s.key] = s.value })
          setForm({
            baseUrl: map.ZALOLITE_BASE_URL || 'https://sms-service.talab.io.vn/api/gateway/v1.0',
            apiKey: map.ZALOLITE_API_KEY || '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'ZALOLITE_BASE_URL', value: form.baseUrl.trim() },
            { key: 'ZALOLITE_API_KEY', value: form.apiKey.trim() },
          ],
        }),
      })
      const json = await res.json()
      setNoti({ open: true, status: json.success, message: json.success ? 'Đã lưu cấu hình ZaloLite' : json.error })
    } catch (e) {
      setNoti({ open: true, status: false, message: 'Lỗi kết nối' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-32 text-sm text-[var(--text-secondary)]">Đang tải...</div>

  return (
    <div className="max-w-xl">
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Cấu hình API Gateway ZaloLite để gửi tin nhắn Zalo (lưu vào cơ sở dữ liệu, không cần biến môi trường).
      </p>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">Base URL</label>
          <input type="text" value={form.baseUrl}
            onChange={e => setForm(p => ({ ...p, baseUrl: e.target.value }))}
            placeholder="https://sms-service.talab.io.vn/api/gateway/v1.0"
            className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 font-mono" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">API Key</label>
          <input type="password" value={form.apiKey}
            onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))}
            placeholder="zlite_..."
            className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 font-mono" />
          <p className="text-xs text-[var(--text-secondary)] mt-1">Bắt buộc để gửi tin nhắn Zalo.</p>
        </div>
      </div>
      <button onClick={handleSave} disabled={saving}
        className="mt-6 px-4 py-2 bg-[var(--main_d)] text-white text-sm font-medium rounded hover:opacity-90 disabled:opacity-40 cursor-pointer border-none">
        {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
      </button>
      <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.message}
        button={<button onClick={() => setNoti(p => ({ ...p, open: false }))}
          className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2">Đóng</button>} />
    </div>
  )
}

const TABS = [
  { key: 'zalo', label: 'Zalo Proxy' },
  { key: 'sla', label: 'Cấu hình SLA' },
  { key: 'zalolite', label: 'ZaloLite' },
  { key: 'drive', label: 'Đồng bộ Drive' },
]

export default function SettingClient({ zaloAccounts, users }) {
  const [tab, setTab] = useState('zalo')

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Cài đặt</h1>
      <div className="flex gap-0 border-b border-[var(--border-color)] mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-none ${tab === t.key ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'zalo' && <ZaloTab zaloAccounts={zaloAccounts} users={users} />}
        {tab === 'sla' && <SlaTab />}
        {tab === 'zalolite' && <ZaloLiteTab />}
        {tab === 'drive' && <DriveVerifyTab />}
      </div>
    </div>
  )
}
