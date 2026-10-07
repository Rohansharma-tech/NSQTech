import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User.model';
import { RecordModel } from '../models/Record.model';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mploycheck';

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function seed() {
  console.log('[Seed] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('[Seed] Connected');

  // Clear existing
  await UserModel.deleteMany({});
  await RecordModel.deleteMany({});
  console.log('[Seed] Cleared existing data');

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = await UserModel.insertMany([
    {
      userId: 'admin01',
      name: 'Alice Administrator',
      email: 'alice@nsqtech.com',
      password: await hash('Admin@123'),
      role: 'admin',
      isActive: true,
      accessLevel: 5,
      lastLogin: new Date('2026-10-06T08:00:00Z'),
    },
    {
      userId: 'user01',
      name: 'Bob Johnson',
      email: 'bob@nsqtech.com',
      password: await hash('User@123'),
      role: 'general',
      isActive: true,
      accessLevel: 1,
      lastLogin: new Date('2026-10-06T09:30:00Z'),
    },
    {
      userId: 'user02',
      name: 'Carol Williams',
      email: 'carol@nsqtech.com',
      password: await hash('User@123'),
      role: 'general',
      isActive: true,
      accessLevel: 2,
      lastLogin: new Date('2026-10-05T14:00:00Z'),
    },
    {
      userId: 'user03',
      name: 'David Brown',
      email: 'david@nsqtech.com',
      password: await hash('User@123'),
      role: 'general',
      isActive: false,
      accessLevel: 1,
    },
    {
      userId: 'admin02',
      name: 'Eve Martinez',
      email: 'eve@nsqtech.com',
      password: await hash('Admin@456'),
      role: 'admin',
      isActive: true,
      accessLevel: 5,
    },
  ]);
  console.log(`[Seed] Inserted ${users.length} users`);

  // ── Records ────────────────────────────────────────────────────────────────
  const recordData = [
    // accessLevel 1 — visible to all
    { title: 'Onboarding Checklist Q4 2026', category: 'HR', status: 'active', priority: 'medium', accessLevel: 1, createdBy: 'admin01' },
    { title: 'Office Supply Request Oct 2026', category: 'Operations', status: 'pending', priority: 'low', accessLevel: 1, createdBy: 'user01' },
    { title: 'Employee Handbook v3.2', category: 'HR', status: 'active', priority: 'low', accessLevel: 1, createdBy: 'admin01' },
    { title: 'IT Equipment Request - Q4', category: 'IT', status: 'pending', priority: 'medium', accessLevel: 1, createdBy: 'user02' },
    // accessLevel 2 — visible to general (level 2) and admin
    { title: 'Annual Leave Policy Update', category: 'HR', status: 'active', priority: 'high', accessLevel: 2, createdBy: 'admin01' },
    { title: 'Network Upgrade Proposal', category: 'IT', status: 'active', priority: 'high', accessLevel: 2, createdBy: 'admin01' },
    { title: 'Compliance Audit Report Q3', category: 'Compliance', status: 'archived', priority: 'critical', accessLevel: 2, createdBy: 'admin02' },
    // accessLevel 3+ — admin only
    { title: 'Payroll Adjustment Nov 2026', category: 'Finance', status: 'pending', priority: 'critical', accessLevel: 3, createdBy: 'admin01' },
    { title: 'Legal Contract Review - Vendor A', category: 'Legal', status: 'active', priority: 'high', accessLevel: 3, createdBy: 'admin02' },
    { title: 'Board Meeting Minutes Oct 2026', category: 'Compliance', status: 'active', priority: 'high', accessLevel: 4, createdBy: 'admin01' },
    { title: 'Executive Compensation Report', category: 'Finance', status: 'active', priority: 'critical', accessLevel: 4, createdBy: 'admin02' },
    { title: 'M&A Due Diligence Files', category: 'Legal', status: 'active', priority: 'critical', accessLevel: 5, createdBy: 'admin01' },
    { title: 'System Architecture Secrets', category: 'IT', status: 'active', priority: 'critical', accessLevel: 5, createdBy: 'admin02' },
  ];

  const records = await RecordModel.insertMany(
    recordData.map((r, i) => ({
      ...r,
      recordId: `REC-${String(i + 1).padStart(4, '0')}`,
      description: `Detailed description for record: ${r.title}. This record was created as part of the NSQTech MPloyChek system and contains ${r.category} department information at access level ${r.accessLevel}.`,
    }))
  );
  console.log(`[Seed] Inserted ${records.length} records`);

  console.log('\n[Seed] ✅ Done! Seed credentials:');
  console.log('  Admin:        userId=admin01  password=Admin@123  role=admin');
  console.log('  Admin 2:      userId=admin02  password=Admin@456  role=admin');
  console.log('  General User: userId=user01   password=User@123   role=general');
  console.log('  General User: userId=user02   password=User@123   role=general');
  console.log('  Inactive:     userId=user03   password=User@123   role=general (inactive)');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
