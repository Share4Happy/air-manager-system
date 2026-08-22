export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        process.env.TZ = process.env.TZ || 'Asia/Ho_Chi_Minh';
        const { startInternalScheduler } = await import('@/lib/scheduler');
        startInternalScheduler();
    }
}

