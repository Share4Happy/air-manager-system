export function getCookieName() {
  return process.env.TOKEN_COOKIE_NAME || process.env.token || 'token';
}

export function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev-secret';
}

export function getAppUrl() {
  return process.env.URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
}

export function getMongoUri() {
  return process.env.MongoDB_URI || process.env.MONGODB_URI || '';
}

export function getEportfolioUrl() {
  return process.env.NEXT_PUBLIC_EPORTFOLIO_URL || 'http://localhost:3001';
}

export function getDriveImageBase() {
  return process.env.NEXT_PUBLIC_DRIVE_IMAGE_URL || 'https://lh3.googleusercontent.com/d/';
}

export function getDriveFolderBase() {
  return process.env.NEXT_PUBLIC_DRIVE_FOLDER_URL || 'https://drive.google.com/drive/folders/';
}

export function getDriveThumbnailBase() {
  return process.env.NEXT_PUBLIC_DRIVE_THUMBNAIL_URL || 'https://drive.google.com/thumbnail?id=';
}

export function getDrivePreviewBase() {
  return process.env.NEXT_PUBLIC_DRIVE_PREVIEW_URL || 'https://drive.google.com/file/d/';
}

export function getDriveDownloadBase() {
  return process.env.NEXT_PUBLIC_DRIVE_DOWNLOAD_URL || 'https://drive.google.com/uc?export=download&id=';
}

export function getDefaultAvatarId() {
  return process.env.NEXT_PUBLIC_DRIVE_DEFAULT_AVATAR_ID || '1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG';
}
