'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Noti from '@/components/(features)/(noti)/noti'
import { ROLES, RoleBadge } from './shared'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function QuizView() {
  const router = useRouter()
  const [role, setRole] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [passRate, setPassRate] = useState(0.8)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [noti, setNoti] = useState({ open: false, status: false, message: '' })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me')
        const json = await res.json()
        const r = json.user?.role?.[0]
        if (cancelled) return
        if (ROLES.includes(r)) {
          setRole(r)
          const g = await fetch(`/api/quiz?role=${r}`)
          const gj = await g.json()
          if (!cancelled) {
            setQuestions(gj.success && gj.data ? gj.data.questions || [] : [])
            setPassRate(gj.success && gj.data?.passRate ? gj.data.passRate : 0.8)
          }
        } else {
          setRole(null)
          setQuestions([])
        }
      } catch {
        if (!cancelled) { setRole(null); setQuestions([]) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/quiz/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, answers: questions.map((_, i) => answers[i] ?? -1) }),
      })
      const json = await res.json()
      if (json.success) {
        setResult(json.data)
      } else {
        setNoti({ open: true, status: false, message: json.error || 'Lỗi khi nộp bài' })
      }
    } catch {
      setNoti({ open: true, status: false, message: 'Lỗi kết nối' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="w-full h-full flex items-center justify-center text-sm text-[var(--text-secondary)]">Đang tải...</div>

  if (!role) return <div className="w-full h-full flex items-center justify-center text-sm text-[var(--text-secondary)]">Không có bài kiểm tra cho vai trò của bạn.</div>

  if (questions.length === 0) return <div className="w-full h-full flex items-center justify-center text-sm text-[var(--text-secondary)]">Chưa có câu hỏi cho vai trò {role}.</div>

  const answeredCount = questions.reduce((n, _, i) => n + (answers[i] !== undefined ? 1 : 0), 0)
  const allAnswered = answeredCount === questions.length
  const progressPct = Math.round((answeredCount / questions.length) * 100)
  const remaining = questions.length - answeredCount

  if (result) {
    const pct = Math.round((result.score / result.total) * 100)
    const R = 52
    const C = 2 * Math.PI * R
    const offset = C * (1 - pct / 100)
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-xl mx-auto py-8 px-4 flex flex-col items-center">
          <div className="w-full rounded-2xl bg-white p-8 flex flex-col items-center"
            style={{ border: '1px solid var(--border-color)', boxShadow: 'var(--boxshaw)' }}>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Kết quả bài kiểm tra</h2>
            <div className="mb-3"><RoleBadge role={role} /></div>

            <div className="relative w-36 h-36 my-4">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r={R} fill="none" stroke="var(--hover)" strokeWidth="12" />
                <circle cx="60" cy="60" r={R} fill="none"
                  stroke={result.passed ? 'var(--green)' : 'var(--red)'}
                  strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: result.passed ? 'var(--green)' : 'var(--red)' }}>{pct}%</span>
                <span className="text-xs text-[var(--text-secondary)]">{result.score}/{result.total} câu</span>
              </div>
            </div>

            <div className={`px-4 py-2 rounded-full text-sm font-semibold mb-4 ${result.passed ? 'bg-[#eaf7ee] text-[var(--green)]' : 'bg-[#fdecef] text-[var(--red)]'}`}>
              {result.passed ? 'Chúc mừng! Bạn đã nắm rõ hệ thống.' : 'Bạn cần xem lại phần Hướng dẫn.'}
            </div>

            <div className="flex gap-2.5">
              <button onClick={() => { setResult(null); setAnswers({}) }}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 cursor-pointer border-none"
                style={{ background: 'var(--main_d)' }}>
                Làm lại
              </button>
              <button onClick={() => router.push('/info?tab=guide')}
                className="px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none"
                style={{ background: 'var(--main_l)', color: 'var(--main_d)' }}>
                Xem lại Hướng dẫn
              </button>
            </div>
          </div>
        </div>
        <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.message}
          button={<button onClick={() => setNoti(p => ({ ...p, open: false }))}
            className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2">Đóng</button>} />
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto py-6 px-4 flex flex-col gap-5">
        <div className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #e8f4ff 0%, #f8fbff 60%, #ffffff 100%)', border: '1px solid #d9ecff', boxShadow: 'var(--boxshaw)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #0374da 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <div className="flex items-center gap-4 relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: '#0374da', boxShadow: 'var(--boxshaw)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Bài kiểm tra</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">{questions.length} câu hỏi · đạt {Math.round(passRate * 100)}% trở lên để hoàn thành</p>
            </div>
            {role && <div className="ml-auto"><RoleBadge role={role} size="lg" /></div>}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4"
          style={{ border: '1px solid var(--border-color)', boxShadow: 'var(--boxshaw)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">Tiến độ</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--main_d)' }}>{answeredCount}/{questions.length} đã trả lời</span>
          </div>
          <div className="w-full h-2.5 rounded-full" style={{ background: 'var(--main_l)' }}>
            <div className="h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressPct}%`, background: 'var(--main_d)' }} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {questions.map((q, qi) => (
            <div key={qi} className="rounded-2xl bg-white p-5"
              style={{ border: '1px solid var(--border-color)', boxShadow: 'var(--boxshaw)' }}>
              <div className="flex items-start gap-2.5 mb-3">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'var(--main_d)' }}>
                  {qi + 1}
                </span>
                <p className="text-sm font-semibold text-[var(--text-primary)] leading-relaxed">{q.question}</p>
              </div>
              <div className="flex flex-col gap-2 pl-[26px]">
                {q.options.map((o, oi) => {
                  const selected = answers[qi] === oi
                  return (
                    <label key={oi}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 border text-sm
                        ${selected
                          ? 'border-[#bfe0ff]'
                          : 'border-transparent hover:bg-[var(--hover)]'}`}
                      style={selected ? { background: 'var(--main_l)' } : {}}>
                      <input type="radio" name={`q${qi}`} checked={selected}
                        onChange={() => setAnswers(p => ({ ...p, [qi]: oi }))} className="hidden" />
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                        ${selected ? 'text-white' : 'text-[var(--text-secondary)] bg-[var(--hover)]'}`}
                        style={selected ? { background: 'var(--main_d)' } : {}}>
                        {LETTERS[oi] || oi + 1}
                      </span>
                      <span className="text-[var(--text-primary)]">{o}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSubmit} disabled={submitting || !allAnswered}
          className="w-full px-6 py-3 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer border-none disabled:opacity-40"
          style={{ background: 'var(--main_d)' }}>
          {submitting ? 'Đang chấm điểm...' : allAnswered ? 'Nộp bài' : `Còn ${remaining} câu chưa trả lời`}
        </button>
      </div>

      <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.message}
        button={<button onClick={() => setNoti(p => ({ ...p, open: false }))}
          className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2">Đóng</button>} />
    </div>
  )
}
