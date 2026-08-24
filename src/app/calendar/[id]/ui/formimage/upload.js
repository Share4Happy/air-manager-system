/**
 * Tải file trực tiếp lên Google Drive qua Resumable Upload Session
 * Tránh hoàn toàn giới hạn 100MB của Cloudflare và giải phóng tải RAM cho server.
 */
export function uploadDirectToDrive(file, folderId, { fileType, oldImageId, onProgress, timeoutMs = 600000 } = {}) {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Tạo Resumable Session URL từ Server
            const sessionRes = await fetch('/api/drive-upload/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folderId,
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
                if (sessionRes.status === 413) {
                    throw new Error('Dung lượng tệp vượt quá giới hạn truyền tải (413 Payload Too Large).');
                }
                throw new Error(`Server trả về lỗi không phải JSON (status: ${sessionRes.status})`);
            }

            if (!sessionRes.ok || sessionData.status !== 2 || !sessionData.uploadUrl) {
                throw new Error(sessionData.mes || `Không thể khởi tạo phiên tải lên Google Drive (status: ${sessionRes.status})`);
            }

            const uploadUrl = sessionData.uploadUrl;
            const targetFolderId = sessionData.folderId || folderId;

            // 2. Upload file trực tiếp lên Google Drive qua XHR PUT
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

            const timer = setTimeout(() => {
                xhr.abort();
                reject(new Error('Quá thời gian chờ tải lên Google Drive.'));
            }, timeoutMs);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && onProgress) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            };

            xhr.onload = async () => {
                clearTimeout(timer);
                if (xhr.status !== 200 && xhr.status !== 201) {
                    reject(new Error(`Tải lên Google Drive thất bại (status: ${xhr.status}): ${xhr.responseText.slice(0, 200)}`));
                    return;
                }

                let driveFile;
                try {
                    driveFile = JSON.parse(xhr.responseText);
                } catch {
                    reject(new Error('Google Drive trả về phản hồi không hợp lệ sau khi tải lên.'));
                    return;
                }

                const uploadedId = driveFile.id;
                if (!uploadedId) {
                    reject(new Error('Google Drive không trả về fileId sau khi tải lên.'));
                    return;
                }

                // 3. Gọi Complete API để cập nhật MongoDB
                try {
                    const completeRes = await fetch('/api/drive-upload/complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            folderId: targetFolderId,
                            fileId: uploadedId,
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

                    resolve({ status: 200, result: completeData });
                } catch (completeErr) {
                    reject(completeErr);
                }
            };

            xhr.onerror = () => {
                clearTimeout(timer);
                reject(new Error('Lỗi kết nối mạng khi tải trực tiếp lên Google Drive.'));
            };

            xhr.onabort = () => {
                clearTimeout(timer);
                reject(new Error('Đã hủy tải lên.'));
            };

            xhr.send(file);

        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Tải file truyền thống qua API backend (Fallback)
 */
export function uploadViaXHR(formData, { onProgress, timeoutMs }) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/updateimage');
        xhr.responseType = 'text';

        const timer = setTimeout(() => {
            xhr.abort();
            reject(new Error('Quá thời gian chờ tải lên.'));
        }, timeoutMs);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };

        xhr.onload = () => {
            clearTimeout(timer);
            const text = xhr.responseText;
            if (!text) {
                reject(new Error(`Server trả về phản hồi rỗng (status: ${xhr.status})`));
                return;
            }
            let result;
            try {
                result = JSON.parse(text);
            } catch {
                if (xhr.status === 413) {
                    reject(new Error('Dung lượng tệp vượt quá giới hạn 100MB của mạng trung chuyển (413 Payload Too Large).'));
                    return;
                }
                reject(new Error(`Server trả về dữ liệu không phải JSON (status: ${xhr.status}): ${text.slice(0, 200)}`));
                return;
            }
            resolve({ status: xhr.status, result });
        };

        xhr.onerror = () => {
            clearTimeout(timer);
            reject(new Error('Lỗi kết nối mạng khi tải lên.'));
        };

        xhr.onabort = () => {
            clearTimeout(timer);
            reject(new Error('Đã hủy tải lên.'));
        };

        xhr.send(formData);
    });
}
