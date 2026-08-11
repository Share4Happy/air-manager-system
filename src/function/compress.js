import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import ffmpegStatic from 'ffmpeg-static';

const execFileP = promisify(execFile);

function getFfmpegPath() {
    if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
    return ffmpegStatic || 'ffmpeg';
}

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const CRF = 19;
const MAX_BITRATE = '8M';
const BUF_SIZE = '16M';
const AUDIO_BITRATE = '128k';

export async function compressVideoToHD(buffer, { mimeType = 'video/mp4', originalName = 'video' } = {}) {
    const ext = (originalName.split('.').pop() || 'mp4').toLowerCase();
    const base = originalName.replace(/\.[^.]+$/, '') || 'video';
    const inputPath = path.join(os.tmpdir(), `vcomp-in-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
    const outputPath = path.join(os.tmpdir(), `vcomp-out-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`);

    try {
        fs.writeFileSync(inputPath, buffer);

        const ffmpegPath = getFfmpegPath();
        const args = [
            '-y',
            '-i', inputPath,
            '-vf', `scale='min(${MAX_WIDTH},iw)':'min(${MAX_HEIGHT},ih)':force_original_aspect_ratio=decrease`,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', String(CRF),
            '-maxrate', MAX_BITRATE,
            '-bufsize', BUF_SIZE,
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            '-b:a', AUDIO_BITRATE,
            '-movflags', '+faststart',
            outputPath,
        ];

        await execFileP(ffmpegPath, args, { timeout: 300000, maxBuffer: 1024 * 1024 * 64 });

        const outBuffer = fs.readFileSync(outputPath);
        return {
            buffer: outBuffer,
            mimeType: 'video/mp4',
            name: `${base}.mp4`,
        };
    } catch (error) {
        console.error('[compressVideoToHD] Lỗi nén video, sẽ tải lên file gốc:', error.message);
        return null;
    } finally {
        for (const p of [inputPath, outputPath]) {
            try {
                if (fs.existsSync(p)) fs.unlinkSync(p);
            } catch { }
        }
    }
}
