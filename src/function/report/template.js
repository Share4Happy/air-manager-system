import { getReportPeriod, toVnParts, fmtDate, fmtDayHeader } from './datetime';
import { buildAttendanceReportData } from './attendance';
import { buildMonthlyReportData } from './monthly';

export function normalizeMessageText(text) {
    return (text || '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export async function renderReportTemplate(template, variables = {}) {
    if (!template) return variables.body || '';
    let message = template;
    // Thay thế toàn bộ placeholder không phân biệt hoa thường và khoảng trắng
    Object.entries(variables).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
            const reg = new RegExp(`{\\s*${k}\\s*}`, 'gi');
            message = message.replace(reg, String(v));
        }
    });
    return message;
}

export async function buildReportVariables(cfg, now = new Date()) {
    const period = getReportPeriod(cfg, now);
    const isSingleDay = period.isSingleDay !== undefined
        ? period.isSingleDay
        : ((new Date(period.end).getTime() - new Date(period.start || now).getTime()) <= 24 * 60 * 60 * 1000 + 1000);

    let periodLabel = '';
    if (cfg.reportType === 'monthly') {
        periodLabel = `Tháng ${period.month}/${period.year}`;
    } else if (isSingleDay) {
        periodLabel = fmtDayHeader(period.targetDate || period.start);
    } else {
        periodLabel = `${fmtDate(period.start)} - ${fmtDate(period.targetDate || new Date(period.end.getTime() - 1000))}`;
    }

    const attPeriod = { start: period.start, end: period.end };
    const vnNow = toVnParts(now);
    const monPeriod = cfg.reportType === 'monthly'
        ? { year: period.year, month: period.month }
        : { year: vnNow.y, month: vnNow.mo };

    const [attRes, monRes] = await Promise.all([
        buildAttendanceReportData({ start: attPeriod.start, end: attPeriod.end, options: cfg.reportOptions?.attendance }),
        buildMonthlyReportData({ year: monPeriod.year, month: monPeriod.month, options: cfg.reportOptions?.monthly }),
    ]);

    const primaryBody = cfg.reportType === 'monthly' ? monRes.fullText : attRes.fullText;
    const vars = {
        ...monRes.variables,
        ...attRes.variables,
        date: fmtDate(now),
        period: periodLabel,
        body: primaryBody,
    };

    const meta = {
        classCount: cfg.reportType === 'monthly' ? (monRes.classCount || 0) : (attRes.classCount || 0),
        lessonCount: attRes.lessonCount || 0,
    };
    return { vars, meta };
}
