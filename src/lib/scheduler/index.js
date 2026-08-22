import dbConnect from '@/config/connectDB';
import { pollPendingCampaignsJob } from './jobs/poll-campaign.job';
import { processReportsJob } from './jobs/report.job';
import { processCareSendsJob } from './jobs/care-lesson.job';
import { processZaloCampaignsJob } from './jobs/zalo-campaign.job';
import { processDriveScanJob } from './jobs/drive-scan.job';

let isTickRunning = false;

export async function runSchedulerTick() {
    if (isTickRunning) {
        return { success: true, message: 'Previous scheduler tick is still running, skipping.' };
    }
    isTickRunning = true;

    try {
        await dbConnect();

        // 1. Thăm dò kết quả các chiến dịch Zalo bất đồng bộ
        await pollPendingCampaignsJob().catch(err => {
            console.error('[Scheduler] Poll campaigns error:', err);
        });

        // 2. Xử lý báo cáo học vụ định kỳ đến hạn
        await processReportsJob().catch(err => {
            console.error('[Scheduler] Reports job error:', err);
        });

        // 3. Xử lý gửi tin nhắn chăm sóc học sinh
        await processCareSendsJob().catch(err => {
            console.error('[Scheduler] Care sends job error:', err);
        });

        // 4. Xử lý lịch gửi tin nhắn / kết bạn Zalo marketing
        const dueResult = await processZaloCampaignsJob().catch(err => {
            console.error('[Scheduler] Zalo campaigns job error:', err);
            return { count: 0 };
        });

        // 5. Xử lý lịch quét dung lượng Google Drive tự động
        await processDriveScanJob().catch(err => {
            console.error('[Scheduler] Drive scan job error:', err);
        });

        return { success: true, processedTasks: dueResult?.count || 0 };
    } catch (error) {
        console.error('[Scheduler] Tick global error:', error);
        return { success: false, error: error.message };
    } finally {
        isTickRunning = false;
    }
}

export function startInternalScheduler() {
    if (globalThis.__air_scheduler_interval) {
        return;
    }

    console.log('[Scheduler] Initializing background scheduler (interval: 60s)...');

    // Khởi chạy tick đầu tiên sau 5s khi server đã boot xong
    setTimeout(() => {
        runSchedulerTick().catch(err => {
            console.error('[Scheduler Startup Tick Error]', err);
        });
    }, 5000);

    globalThis.__air_scheduler_interval = setInterval(() => {
        runSchedulerTick().catch(err => {
            console.error('[Scheduler Tick Error]', err);
        });
    }, 60000);
}
