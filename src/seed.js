import 'dotenv/config';
import { connectDB } from './db.js';
import Classroom from './models/Classroom.js';

// Hard-code your classrooms here
const classrooms = [
  { grade: 2, room: 1, totalStudentsCount: 16 },
];

await connectDB();

for (const data of classrooms) {
  await Classroom.findOneAndUpdate(
    { grade: data.grade, room: data.room },
    { $setOnInsert: { ...data, absentStudents: [] } },
    { upsert: true, new: true },
  );
  console.log(`Seeded classroom ${data.grade}-${data.room}`);
}

console.log('Done.');
process.exit(0);
