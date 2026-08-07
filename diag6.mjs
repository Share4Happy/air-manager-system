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
for (const d of docs) for (const dt of d.Detail || []) if (dt.Image) folders.push({ course: d.ID, folder: String(dt.Image), day: dt.Day ? String(dt.Day).slice(0,10) : '' });
const dbIds = new Set(folders.map(f => f.folder));
console.log('DB lesson folders:', dbIds.size);

const auth = new google.auth.GoogleAuth({
  projectId: env.GOOGLE_PROJECT_ID,
  credentials: { client_email: env.GOOGLE_CLIENT_EMAIL, private_key: env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') },
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

const inDrive = new Set();
for (const did of ['0AK_Z4-cveE6dUk9PVA','0AHwRwBj6LOdKUk9PVA']) {
  let token;
  do {
    const res = await drive.files.list({
      corpora: 'drive', driveId: did, includeItemsFromAllDrives: true, supportsAllDrives: true,
      pageSize: 1000, fields: 'nextPageToken,files(id)', q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
    });
    for (const f of res.data.files || []) inDrive.add(f.id);
    token = res.data.nextPageToken;
  } while (token);
}
console.log('folders in both drives:', inDrive.size);

const missing = folders.filter(f => !inDrive.has(f.folder));
console.log('DB folders not found in either drive (trashed OR inaccessible):', missing.length);

const byCourse = {};
for (const m of missing) byCourse[m.course] = (byCourse[m.course] || 0) + 1;
console.log('by course (top 15):', Object.entries(byCourse).sort((a,b)=>b[1]-a[1]).slice(0,15));

// check the few most recent/relevant ones to classify trashed vs inaccessible
const recent = missing.sort((a,b) => (b.day||'').localeCompare(a.day||'')).slice(0, 12);
for (const m of recent) {
  try {
    const r = await drive.files.get({ fileId: m.folder, supportsAllDrives: true, fields: 'id,driveId,trashed,capabilities,owners' });
    console.log(`${m.course} ${m.day} | ${m.folder} | trashed=${r.data.trashed} driveId=${r.data.driveId} addChildren=${r.data.capabilities.canAddChildren} owners=${(r.data.owners||[]).map(o=>o.emailAddress).join(',')}`);
  } catch (e) {
    console.log(`${m.course} ${m.day} | ${m.folder} | ERROR: ${e.errors?.[0]?.message || e.message}`);
  }
}
await mongoose.disconnect();
