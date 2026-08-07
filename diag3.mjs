import { google } from 'googleapis';
import fs from 'fs';
import pkg from 'mongoose';
const { default: mongoose } = pkg;

const env = {};
for (const line of fs.readFileSync('.env.development', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
await mongoose.connect(env.MongoDB_URI || 'mongodb://127.0.0.1:27017/air');
const Course = mongoose.connection.collection('courses');
const docs = await Course.find({}, { projection: { ID: 1, 'Detail.Image': 1, 'Detail.Day': 1 } }).toArray();
const folders = [];
for (const d of docs) {
  for (const dt of d.Detail || []) {
    if (dt.Image) folders.push({ course: d.ID, folder: String(dt.Image), day: dt.Day ? String(dt.Day).slice(0, 10) : '' });
  }
}
console.log('total lesson folders:', folders.length, 'unique:', new Set(folders.map(f => f.folder)).size);

const auth = new google.auth.GoogleAuth({
  projectId: env.GOOGLE_PROJECT_ID,
  credentials: { client_email: env.GOOGLE_CLIENT_EMAIL, private_key: env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') },
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

const bad = [];
let i = 0;
for (const f of folders) {
  i++;
  try {
    const r = await drive.files.get({ fileId: f.folder, supportsAllDrives: true, fields: 'id,driveId,trashed,capabilities' });
    if (r.data.trashed || !r.data.capabilities.canAddChildren) {
      bad.push({ ...f, reason: r.data.trashed ? 'TRASHED' : 'no-addChildren', driveId: r.data.driveId });
    }
  } catch (e) {
    bad.push({ ...f, reason: e.errors?.[0]?.message || e.message, driveId: '?' });
  }
}
console.log('problem folders:', bad.length);
for (const b of bad.slice(0, 40)) console.log(JSON.stringify(b));
await mongoose.disconnect();
