import mongoose from 'mongoose';

const absentStudentSchema = new mongoose.Schema({
  studentNumber: { type: Number, required: true },
  name: { type: String, required: true },
  reason: { type: String, default: '' },
}, { _id: false });

const classroomSchema = new mongoose.Schema({
  grade: { type: Number, required: true },
  room: { type: Number, required: true },
  totalStudentsCount: { type: Number, required: true },
  absentStudents: { type: [absentStudentSchema], default: [] },
});

classroomSchema.index({ grade: 1, room: 1 }, { unique: true });

export default mongoose.model('Classroom', classroomSchema);
