import mongoose, { Document, Schema } from 'mongoose';

export interface IJournalLine {
  account: mongoose.Types.ObjectId;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface IJournalEntry extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  entryNumber: string; // e.g. "JE-2026-0001"
  date: Date;
  lines: IJournalLine[];
  totalDebit: number;
  totalCredit: number;
  referenceType?: 'Order' | 'PurchaseOrder' | 'Payroll' | 'Manual';
  referenceId?: mongoose.Types.ObjectId;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const journalLineSchema = new Schema<IJournalLine>(
  {
    account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    accountCode: { type: String, required: true },
    accountName: { type: String, required: true },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    description: { type: String },
  },
  { _id: false }
);

const journalEntrySchema = new Schema<IJournalEntry>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    entryNumber: { type: String, required: true, unique: true, index: true },
    date: { type: Date, default: Date.now, index: true },
    lines: { type: [journalLineSchema], required: true },
    totalDebit: { type: Number, required: true },
    totalCredit: { type: Number, required: true },
    referenceType: { type: String, enum: ['Order', 'PurchaseOrder', 'Payroll', 'Manual'], default: 'Manual' },
    referenceId: { type: Schema.Types.ObjectId },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const JournalEntry = mongoose.model<IJournalEntry>('JournalEntry', journalEntrySchema);
