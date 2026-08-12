import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import Logs from '@/models/log'

function startOfDay(d) {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x
}

function startOfWeek(d) {
    const x = startOfDay(d)
    const day = x.getDay()
    const diff = day === 0 ? -6 : 1 - day
    x.setDate(x.getDate() + diff)
    return x
}

function startOfMonth(d) {
    const x = new Date(d)
    x.setDate(1)
    x.setHours(0, 0, 0, 0)
    return x
}

export async function GET(request) {
    try {
        await connectDB()
        const range = new URL(request.url).searchParams.get('range') || 'week'
        const now = new Date()
        let start
        let labels
        let bucketSize
        let todayIndex = -1

        if (range === 'day') {
            bucketSize = 'day'
            start = startOfDay(now)
            start.setDate(start.getDate() - 6)
            labels = []
            for (let i = 0; i < 7; i++) {
                const d = new Date(start)
                d.setDate(start.getDate() + i)
                labels.push(`${d.getDate()}/${d.getMonth() + 1}`)
            }
        } else if (range === 'month') {
            bucketSize = 'month'
            start = startOfMonth(now)
            start.setMonth(start.getMonth() - 5)
            labels = []
            for (let i = 0; i < 6; i++) {
                const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
                labels.push(`${d.getMonth() + 1}/${d.getFullYear()}`)
            }
        } else {
            bucketSize = 'day'
            start = startOfWeek(now)
            labels = []
            const today = startOfDay(now)
            for (let i = 0; i < 7; i++) {
                const d = new Date(start)
                d.setDate(start.getDate() + i)
                labels.push(`${d.getDate()}/${d.getMonth() + 1}`)
                if (startOfDay(d).getTime() === today.getTime()) todayIndex = i
            }
        }

        const logs = await Logs.find({ type: 'sendReport', createdAt: { $gte: start } })
            .select('createdAt')
            .lean()
        const counts = new Array(labels.length).fill(0)
        for (const l of logs) {
            const d = new Date(l.createdAt)
            let idx = -1
            if (bucketSize === 'day') {
                idx = Math.floor((startOfDay(d) - start) / 86400000)
            } else if (bucketSize === 'week') {
                idx = Math.floor((startOfWeek(d) - start) / (7 * 86400000))
            } else {
                idx = (d.getFullYear() - start.getFullYear()) * 12 + (d.getMonth() - start.getMonth())
            }
            if (idx >= 0 && idx < counts.length) counts[idx]++
        }
        return NextResponse.json({ success: true, data: { labels, data: counts, todayIndex } })
    } catch (err) {
        console.error('Report Stats API Error:', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
