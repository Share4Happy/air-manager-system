import { processPendingCareSends } from '@/app/actions/lessonCancel.actions';

export async function processCareSendsJob() {
    try {
        await processPendingCareSends();
    } catch (err) {
        console.error('[Scheduler][CareJob] Error processing care sends:', err.message);
    }
}
