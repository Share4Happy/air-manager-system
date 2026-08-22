import ReportConfig from '@/models/reportConfig';
import { computeNextRunAt, executeReportConfig } from '@/function/report';

export async function processReportsJob() {
    const now = new Date();
    const configs = await ReportConfig.find({ isActive: true, nextRunAt: { $lte: now } }).select('_id').lean();

    for (const { _id } of configs) {
        const claimed = await ReportConfig.findOneAndUpdate(
            { _id, nextRunAt: { $lte: now } },
            { $set: { nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } },
        ).lean();
        if (!claimed) continue;

        try {
            const cfg = await ReportConfig.findById(_id).lean();
            const result = await executeReportConfig(cfg);

            if (result.queued) {
                const fresh = await ReportConfig.findById(_id).select('queueResumeAt').lean();
                if (fresh?.queueResumeAt) {
                    await ReportConfig.findByIdAndUpdate(_id, { nextRunAt: fresh.queueResumeAt });
                }
                continue;
            }

            const nextRunAt = computeNextRunAt({
                frequency: cfg.frequency,
                sendTime: cfg.sendTime,
                weekday: cfg.weekday,
                monthDay: cfg.monthDay,
            });

            await ReportConfig.findByIdAndUpdate(_id, {
                lastSentAt: now,
                nextRunAt,
            });

            if (!result.status) {
                console.warn(`[Scheduler][ReportJob] Config ${_id} send reported failure: ${result.message}`);
            }
        } catch (err) {
            console.error(`[Scheduler][ReportJob] Config ${_id} error:`, err.message);
            const cfg = await ReportConfig.findById(_id).select('frequency sendTime weekday monthDay').lean();
            if (cfg) {
                await ReportConfig.findByIdAndUpdate(_id, {
                    nextRunAt: computeNextRunAt({
                        frequency: cfg.frequency,
                        sendTime: cfg.sendTime,
                        weekday: cfg.weekday,
                        monthDay: cfg.monthDay,
                    }),
                });
            }
        }
    }
}
