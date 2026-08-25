/**
 * Tải file lên Google Drive theo phương thức Chunked Resumable Upload
 * - Chia nhỏ file thành các phần (10MB/chunk) gửi lên server để forward sang Drive.
 * - Giải quyết triệt để lỗi CORS của Google Drive API.
 * - Vượt qua 100% giới hạn 100MB của Cloudflare.
 * - Không gây quá tải RAM hay Timeout cho server.
 */
export async function uploadDirectToDrive(file, folderId, { fileType, oldImageId, onProgress, sessionId } = {}) {
    try {
        // 1. Tạo Resumable Session URL từ Server
        const sessionRes = await fetch('/api/drive-upload/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                folderId,
                sessionId,
                fileName: file.name,
                mimeType: file.type || (fileType === 'video' ? 'video/mp4' : 'image/jpeg'),
                fileSize: file.size,
                oldImageId,
            }),
        });

        const sessionText = await sessionRes.text();
        let sessionData;
        try {
            sessionData = JSON.parse(sessionText);
        } catch {
            throw new Error(`Server trả về lỗi khi khởi tạo tải lên (status: ${sessionRes.status})`);
        }

        if (!sessionRes.ok || sessionData.status !== 2 || !sessionData.uploadUrl) {
            throw new Error(sessionData.mes || `Không thể khởi tạo phiên tải lên Google Drive (status: ${sessionRes.status})`);
        }

        const uploadUrl = sessionData.uploadUrl;
        const targetFolderId = sessionData.folderId || folderId;

        // 2. Chia nhỏ file thành các chunk 10MB để gửi lên /api/drive-upload/chunk
        const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB mỗi chunk
        const totalSize = file.size;
        let start = 0;
        let uploadedFileId = null;

        while (start < totalSize) {
            const end = Math.min(start + CHUNK_SIZE, totalSize);
            const chunkBlob = file.slice(start, end);

            const formData = new FormData();
            formData.append('uploadUrl', uploadUrl);
            formData.append('chunk', chunkBlob);
            formData.append('start', String(start));
            formData.append('end', String(end));
            formData.append('total', String(totalSize));

            const chunkRes = await fetch('/api/drive-upload/chunk', {
                method: 'POST',
                body: formData,
            });

            const chunkText = await chunkRes.text();
            let chunkData;
            try {
                chunkData = JSON.parse(chunkText);
            } catch {
                if (chunkRes.status === 413) {
                    throw new Error('Dung lượng chunk vượt quá giới hạn truyền tải (413 Payload Too Large).');
                }
                throw new Error(`Lỗi server khi upload chunk (status: ${chunkRes.status})`);
            }

            if (!chunkRes.ok || chunkData.status !== 2) {
                throw new Error(chunkData.mes || `Lỗi tải lên đoạn ${Math.round(start / (1024 * 1024))}MB`);
            }

            if (onProgress) {
                onProgress(Math.min(100, Math.round((end / totalSize) * 100)));
            }

            if (chunkData.completed && chunkData.fileId) {
                uploadedFileId = chunkData.fileId;
                break;
            }

            start = end;
        }

        if (!uploadedFileId) {
            throw new Error('Không nhận được fileId từ Google Drive sau khi tải lên.');
        }

        // 3. Gọi Complete API để cập nhật MongoDB
        const completeRes = await fetch('/api/drive-upload/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                folderId: targetFolderId,
                sessionId,
                fileId: uploadedFileId,
                fileType: fileType || (file.type.startsWith('video') ? 'video' : 'image'),
                size: file.size,
                name: file.name,
                oldImageId,
            }),
        });

        const completeData = await completeRes.json();
        if (!completeRes.ok || completeData.status !== 2) {
            throw new Error(completeData.mes || 'Cập nhật cơ sở dữ liệu thất bại sau khi tải lên.');
        }

        return { status: 200, result: completeData };

    } catch (err) {
        console.error('[uploadDirectToDrive] Lỗi:', err);
        throw err;
    }
}
