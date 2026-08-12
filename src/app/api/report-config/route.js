import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import ReportConfig from '@/models/reportConfig'
import ReportTemplate from '@/models/reportTemplate'
import ReportSetting from '@/models/reportSetting'
import { normalizeMessageText } from '@/function/report'

export async function GET() {
    try {
        await connectDB()
        const [configs, templates, setting] = await Promise.all([
            ReportConfig.find({})
                .populate('recipientUserIds', 'name phone email')
                .populate('zaloAccountId', 'name avt botId')
                .sort({ createdAt: -1 })
                .lean(),
            ReportTemplate.find({}).sort({ createdAt: -1 }).lean(),
            ReportSetting.findOne().lean(),
        ])
        const cleanConfigs = configs.map(c => ({
            ...c,
            messageTemplate: normalizeMessageText(c.messageTemplate),
            pendingText: normalizeMessageText(c.pendingText),
        }))
        const cleanTemplates = templates.map(t => ({
            ...t,
            content: normalizeMessageText(t.content),
        }))
        return NextResponse.json({
            success: true,
            data: {
                configs: JSON.parse(JSON.stringify(cleanConfigs)),
                templates: JSON.parse(JSON.stringify(cleanTemplates)),
                setting: JSON.parse(JSON.stringify(setting)) || null,
            },
        })
    } catch (err) {
        console.error('Report Config API Error:', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
