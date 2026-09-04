export const TZ = 'Asia/Ho_Chi_Minh';
export const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
export const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

export function toVnParts(d = new Date()) {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return { y: 1970, mo: 1, d: 1, h: 0, mi: 0, s: 0, dayOfWeek: 0 };
    const p = new Intl.DateTimeFormat('en-GB', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(dt);
    const get = t => Number(p.find(x => x.type === t)?.value);
    const y = get('year');
    const mo = get('month');
    const dayOfMonth = get('day');
    const h = get('hour');
    const mi = get('minute');
    const s = get('second');
    const vnDt = new Date(Date.UTC(y, mo - 1, dayOfMonth));
    return { y, mo, d: dayOfMonth, h, mi, s, dayOfWeek: vnDt.getUTCDay() };
}

export function fmtNum(n) {
    return new Intl.NumberFormat('vi-VN').format(n || 0);
}

export function fmtDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    const p = toVnParts(dt);
    return `${String(p.d).padStart(2, '0')}/${String(p.mo).padStart(2, '0')}/${p.y}`;
}

export function fmtTime(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    const p = toVnParts(dt);
    return `${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`;
}

export function fmtDayHeader(d) {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    const p = toVnParts(dt);
    return `${WEEKDAYS[p.dayOfWeek]} - ${String(p.d).padStart(2, '0')}/${String(p.mo).padStart(2, '0')}/${p.y}`;
}

export function parseSendTime(sendTime) {
    const [h, m] = (sendTime || '08:00').split(':').map(Number);
    return {
        hour: Number.isInteger(h) ? h : 8,
        minute: Number.isInteger(m) ? m : 0,
    };
}

export function computeNextRunAt({ frequency, sendTime, weekday, monthDay, after = new Date() }) {
    const { hour, minute } = parseSendTime(sendTime);
    const now = new Date(after);
    const nowVN = new Date(now.getTime() + VN_OFFSET_MS);

    const vnYear = nowVN.getUTCFullYear();
    const vnMonth = nowVN.getUTCMonth();
    const vnDate = nowVN.getUTCDate();
    const vnDay = nowVN.getUTCDay(); // 0 = CN, 1 = T2, ..., 6 = T7

    if (frequency === 'daily') {
        let targetVN = new Date(Date.UTC(vnYear, vnMonth, vnDate, hour, minute, 0, 0));
        let targetUTC = new Date(targetVN.getTime() - VN_OFFSET_MS);

        if (targetUTC <= now) {
            targetVN.setUTCDate(targetVN.getUTCDate() + 1);
            targetUTC = new Date(targetVN.getTime() - VN_OFFSET_MS);
        }
        return targetUTC;
    }

    if (frequency === 'weekly') {
        // weekday: 1 = Thứ 2 ... 7 = Chủ nhật
        const target = weekday >= 1 && weekday <= 7 ? weekday : 1;
        const targetJsDay = target % 7; // 0 = CN, 1 = T2...
        let diff = targetJsDay - vnDay;
        let targetVN = new Date(Date.UTC(vnYear, vnMonth, vnDate + diff, hour, minute, 0, 0));
        let targetUTC = new Date(targetVN.getTime() - VN_OFFSET_MS);

        if (targetUTC <= now) {
            targetVN.setUTCDate(targetVN.getUTCDate() + 7);
            targetUTC = new Date(targetVN.getTime() - VN_OFFSET_MS);
        }
        return targetUTC;
    }

    // monthly
    const targetDay = monthDay >= 1 && monthDay <= 31 ? monthDay : 1;
    let targetVN = new Date(Date.UTC(vnYear, vnMonth, targetDay, hour, minute, 0, 0));
    let targetUTC = new Date(targetVN.getTime() - VN_OFFSET_MS);

    if (targetUTC <= now) {
        targetVN.setUTCMonth(targetVN.getUTCMonth() + 1);
        targetVN.setUTCDate(targetDay);
        targetUTC = new Date(targetVN.getTime() - VN_OFFSET_MS);
    }
    return targetUTC;
}

export function getReportPeriod(cfg, now = new Date()) {
    const vn = toVnParts(now);

    if (cfg.reportType === 'monthly') {
        // Tháng trước theo lịch Việt Nam
        const prevMonthDate = new Date(Date.UTC(vn.y, vn.mo - 2, 1));
        const prevVn = toVnParts(prevMonthDate);
        return {
            type: 'monthly',
            year: prevVn.y,
            month: prevVn.mo,
            start: new Date(Date.UTC(prevVn.y, prevVn.mo - 1, 1, 0, 0, 0, 0) - VN_OFFSET_MS),
            end: new Date(Date.UTC(prevVn.y, prevVn.mo, 1, 0, 0, 0, 0) - VN_OFFSET_MS),
            targetDate: new Date(Date.UTC(prevVn.y, prevVn.mo - 1, 1, 12, 0, 0, 0)),
            isSingleDay: false,
        };
    }

    if (cfg.frequency === 'daily' || cfg.range === 'day') {
        // Trọn vẹn 1 ngày theo giờ Việt Nam (00:00:00 -> 24:00:00)
        const start = new Date(Date.UTC(vn.y, vn.mo - 1, vn.d, 0, 0, 0, 0) - VN_OFFSET_MS);
        const end = new Date(Date.UTC(vn.y, vn.mo - 1, vn.d + 1, 0, 0, 0, 0) - VN_OFFSET_MS);
        const targetDate = new Date(Date.UTC(vn.y, vn.mo - 1, vn.d, 12, 0, 0, 0));
        return {
            type: 'daily',
            start,
            end,
            targetDate,
            isSingleDay: true,
        };
    }

    if (cfg.frequency === 'weekly' || cfg.range === 'week') {
        // 7 ngày gần nhất (từ vn.d - 6 đến hết ngày vn.d)
        const start = new Date(Date.UTC(vn.y, vn.mo - 1, vn.d - 6, 0, 0, 0, 0) - VN_OFFSET_MS);
        const end = new Date(Date.UTC(vn.y, vn.mo - 1, vn.d + 1, 0, 0, 0, 0) - VN_OFFSET_MS);
        const targetDate = new Date(Date.UTC(vn.y, vn.mo - 1, vn.d, 12, 0, 0, 0));
        return {
            type: 'weekly',
            start,
            end,
            targetDate,
            isSingleDay: false,
        };
    }

    // Default 30 ngày gần nhất
    const start = new Date(Date.UTC(vn.y, vn.mo - 2, vn.d, 0, 0, 0, 0) - VN_OFFSET_MS);
    const end = new Date(Date.UTC(vn.y, vn.mo - 1, vn.d + 1, 0, 0, 0, 0) - VN_OFFSET_MS);
    return {
        type: 'custom',
        start,
        end,
        targetDate: now,
        isSingleDay: false,
    };
}

export function computeResumeAt(now = new Date()) {
    const d = new Date(now);
    d.setHours(d.getHours() + 1, 30, 0, 0);
    return d;
}
