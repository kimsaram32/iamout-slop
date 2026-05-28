import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Classroom from './models/Classroom.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

// SSE client registry: "grade-room" -> Set<Response>
const sseClients = new Map();

function getKey(grade, room) {
  return `${grade}-${room}`;
}

function broadcast(grade, room, classroom) {
  const key = getKey(grade, room);
  const clients = sseClients.get(key);
  if (!clients) return;
  const data = `data: ${JSON.stringify(classroom)}\n\n`;
  for (const res of clients) {
    res.write(data);
  }
}

// --- SSE endpoint ---
app.get('/events/:grade/:room', (req, res) => {
  const { grade, room } = req.params;
  const key = getKey(grade, room);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(key)) sseClients.set(key, new Set());
  sseClients.get(key).add(res);

  req.on('close', () => {
    sseClients.get(key)?.delete(res);
  });
});

// --- REST API ---
app.get('/api/:grade/:room', async (req, res) => {
  const { grade, room } = req.params;
  const classroom = await Classroom.findOne({ grade: Number(grade), room: Number(room) });
  if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
  res.json(classroom);
});

// 이동
app.post('/api/:grade/:room/checkout', async (req, res) => {
  const { grade, room } = req.params;
  const { studentNumber, name, reason = '' } = req.body;

  const classroom = await Classroom.findOneAndUpdate(
    { grade: Number(grade), room: Number(room), 'absentStudents.studentNumber': { $ne: studentNumber } },
    { $push: { absentStudents: { studentNumber, name, reason } } },
    { new: true },
  );

  if (!classroom) {
    // Already absent — update reason
    const updated = await Classroom.findOneAndUpdate(
      { grade: Number(grade), room: Number(room), 'absentStudents.studentNumber': studentNumber },
      { $set: { 'absentStudents.$.reason': reason } },
      { new: true },
    );
    if (!updated) return res.status(404).json({ error: 'Classroom not found' });
    broadcast(grade, room, updated);
    return res.json(updated);
  }

  broadcast(grade, room, classroom);
  res.json(classroom);
});

// 복귀
app.post('/api/:grade/:room/checkin', async (req, res) => {
  const { grade, room } = req.params;
  const { studentNumber } = req.body;

  const classroom = await Classroom.findOneAndUpdate(
    { grade: Number(grade), room: Number(room) },
    { $pull: { absentStudents: { studentNumber } } },
    { new: true },
  );
  if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

  broadcast(grade, room, classroom);
  res.json(classroom);
});

// 초기화
app.post('/api/:grade/:room/reset', async (req, res) => {
  const { grade, room } = req.params;

  const classroom = await Classroom.findOneAndUpdate(
    { grade: Number(grade), room: Number(room) },
    { $set: { absentStudents: [] } },
    { new: true },
  );
  if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

  broadcast(grade, room, classroom);
  res.json(classroom);
});

// --- Web app ---
const template = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');

app.get('/:gradeRoom', (req, res) => {
  const match = req.params.gradeRoom.match(/^(\d+)-(\d+)$/);
  if (!match) return res.status(400).send('Invalid classroom format. Use /grade-room e.g. /2-1');
  const [, grade, room] = match;
  const html = template
    .replaceAll('__GRADE__', grade)
    .replaceAll('__ROOM__', room);
  res.send(html);
});

export function startServer() {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}
