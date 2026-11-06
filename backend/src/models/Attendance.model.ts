import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  date: Date; // standard day boundary (YYYY-MM-DD)
  clockIn: Date;
  clockOut?: Date;
  totalHoursWorked?: number;
  status: 'present' | 'late' | 'half_day' | 'absent';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    date: { type: Date, required: true, index: true },
    clockIn: { type: Date, required: true },
    clockOut: { type: Date },
    totalHoursWorked: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['present', 'late', 'half_day', 'absent'],
      default: 'present',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
