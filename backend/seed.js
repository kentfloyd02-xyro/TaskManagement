const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Subject = require('./models/Subject');
const Project = require('./models/Project');
const Task = require('./models/Task');

dotenv.config();

const seedDemoData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_planner';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Connected to MongoDB...');

    const demoEmail = 'student.demo@university.edu';
    let demoUser = await User.findOne({ email: demoEmail });

    if (demoUser) {
      console.log('[Seeder] Existing demo account found. Cleaning old demo data...');
      await Task.deleteMany({ user: demoUser._id });
      await Project.deleteMany({ user: demoUser._id });
      await Subject.deleteMany({ user: demoUser._id });
      await User.deleteOne({ _id: demoUser._id });
    }

    // 1. Create or Update Admin User (kentfloyd02@gmail.com)
    const adminEmail = 'kentfloyd02@gmail.com';
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Kent Floyd (Admin)',
        email: adminEmail,
        password: 'Kentpogi31.',
        course: 'System Administrator',
        yearLevel: 'Faculty / Admin',
        role: 'admin',
        themePreference: 'dark',
      });
      console.log('[Seeder] Admin user created: kentfloyd02@gmail.com / Kentpogi31.');
    } else {
      adminUser.role = 'admin';
      adminUser.password = 'Kentpogi31.';
      await adminUser.save();
      console.log('[Seeder] Existing kentfloyd02@gmail.com updated with role admin and password Kentpogi31.');
    }

    // 2. Create Demo Student User
    demoUser = await User.create({
      name: 'Alex Vance',
      email: demoEmail,
      password: 'password123',
      course: 'BS Computer Science',
      yearLevel: '3rd Year',
      role: 'student',
      themePreference: 'dark',
    });
    console.log('[Seeder] Demo student user created: student.demo@university.edu / password123');

    // Create Initial Broadcast Announcement
    const Announcement = require('./models/Announcement');
    await Announcement.deleteMany({});
    await Announcement.create({
      title: 'Midterm Exam Period Notice',
      message: 'All midterm departmental exams are scheduled for this week. Please review your Exam Reviewer module and submit pending lab deliverables.',
      type: 'urgent',
      authorName: 'Kent Floyd (Admin)',
    });

    // 2. Create Sample Subjects
    const subCS301 = await Subject.create({
      user: demoUser._id,
      code: 'CS301',
      name: 'Software Engineering & Design Patterns',
      color: '#3b82f6',
      instructor: 'Dr. Raymond Reyes',
      schedule: 'Mon/Wed 9:00 AM - 10:30 AM',
      room: 'Lab 402',
    });

    const subIT305 = await Subject.create({
      user: demoUser._id,
      code: 'IT305',
      name: 'Web & Mobile Systems',
      color: '#10b981',
      instructor: 'Prof. Maria Santos',
      schedule: 'Tue/Thu 1:00 PM - 2:30 PM',
      room: 'Room 205',
    });

    const subMATH204 = await Subject.create({
      user: demoUser._id,
      code: 'MATH204',
      name: 'Discrete Mathematics & Probability',
      color: '#f59e0b',
      instructor: 'Engr. Daniel Cruz',
      schedule: 'Fri 8:00 AM - 11:00 AM',
      room: 'Lecture Hall B',
    });

    // 3. Create Sample Project
    const sampleProject = await Project.create({
      user: demoUser._id,
      subject: subCS301._id,
      title: 'Term Capstone Phase 1 - Architecture Blueprint',
      description: 'System requirement specification, UML diagrams, and high-fidelity prototype.',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days ahead
      status: 'In Progress',
    });

    // 4. Create Sample Tasks across Prelim, Midterm, and Finals
    const now = Date.now();
    const tasks = [
      // Prelim Tasks (Mostly completed to showcase the progress bar)
      {
        user: demoUser._id,
        subject: subCS301._id,
        title: 'Prelim Quiz 1: Object-Oriented Principles',
        description: 'Review SOLID principles and Gang of Four pattern concepts.',
        taskType: 'Exam/Quiz',
        academicPeriod: 'Prelim',
        priority: 'High',
        status: 'Completed',
        deadline: new Date(now - 7 * 24 * 60 * 60 * 1000),
        checklist: [
          { text: 'Review Single Responsibility Principle', isDone: true },
          { text: 'Review Factory and Singleton Patterns', isDone: true },
        ],
        completedAt: new Date(now - 6 * 24 * 60 * 60 * 1000),
      },
      {
        user: demoUser._id,
        subject: subIT305._id,
        title: 'Laboratory Activity 1: Responsive Layout with Flexbox & Grid',
        description: 'Submit GitHub repository link and deployed live demo.',
        taskType: 'Activity',
        academicPeriod: 'Prelim',
        priority: 'Medium',
        status: 'Completed',
        deadline: new Date(now - 5 * 24 * 60 * 60 * 1000),
        checklist: [
          { text: 'Mobile breakpoint styling', isDone: true },
          { text: 'Tablet breakpoint styling', isDone: true },
          { text: 'Lighthouse accessibility check', isDone: true },
        ],
        completedAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
      },
      {
        user: demoUser._id,
        subject: subMATH204._id,
        title: 'Prelim Problem Set: Logic Gates & Truth Tables',
        description: 'Solve exercises 1 to 20 on page 84 of Discrete Math textbook.',
        taskType: 'Assignment',
        academicPeriod: 'Prelim',
        priority: 'Medium',
        status: 'Completed',
        deadline: new Date(now - 3 * 24 * 60 * 60 * 1000),
        checklist: [{ text: 'Solve odd-numbered problems', isDone: true }],
        completedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      },

      // Midterm Tasks (Active in-progress workload)
      {
        user: demoUser._id,
        subject: subCS301._id,
        project: sampleProject._id,
        title: 'UML Class Diagram & ERD Modeling',
        description: 'Complete data modeling diagram for client approval.',
        taskType: 'Research',
        academicPeriod: 'Midterm',
        priority: 'Urgent',
        status: 'In Progress',
        deadline: new Date(now + 2 * 24 * 60 * 60 * 1000),
        estimatedMinutes: 90,
        checklist: [
          { text: 'Draft Entity Relationship Diagram (ERD)', isDone: true },
          { text: 'Review foreign key constraints', isDone: false },
          { text: 'Export high-res PDF', isDone: false },
        ],
      },
      {
        user: demoUser._id,
        subject: subIT305._id,
        title: 'REST API Integration & JWT Authentication Lab',
        description: 'Build Express authentication middleware with protected routes.',
        taskType: 'Assignment',
        academicPeriod: 'Midterm',
        priority: 'High',
        status: 'To Do',
        deadline: new Date(now + 4 * 24 * 60 * 60 * 1000),
        estimatedMinutes: 120,
        checklist: [
          { text: 'Implement bcrypt password hashing', isDone: false },
          { text: 'Verify Bearer token middleware', isDone: false },
        ],
      },
      {
        user: demoUser._id,
        subject: subMATH204._id,
        title: 'Midterm Exam: Combinatorics & Permutations',
        description: 'Scheduled in Lecture Hall B at 8:00 AM sharp.',
        taskType: 'Exam/Quiz',
        academicPeriod: 'Midterm',
        priority: 'Urgent',
        status: 'Backlog',
        deadline: new Date(now + 7 * 24 * 60 * 60 * 1000),
        estimatedMinutes: 180,
        checklist: [
          { text: 'Review pigeonhole principle examples', isDone: false },
          { text: 'Practice 2019-2023 mock exam papers', isDone: false },
        ],
      },

      // Finals Tasks
      {
        user: demoUser._id,
        subject: subCS301._id,
        project: sampleProject._id,
        title: 'Final Capstone Project Defense & Live Demonstration',
        description: 'Present complete system architecture and production deployment.',
        taskType: 'Presentation',
        academicPeriod: 'Finals',
        priority: 'Urgent',
        status: 'Backlog',
        deadline: new Date(now + 30 * 24 * 60 * 60 * 1000),
        estimatedMinutes: 240,
        checklist: [
          { text: 'Prepare slide deck presentation', isDone: false },
          { text: 'Record backup video demonstration', isDone: false },
        ],
      },
      {
        user: demoUser._id,
        subject: subIT305._id,
        title: 'Final Production Deployment & CI/CD Pipeline',
        description: 'Automate build pipelines and deploy containerized client.',
        taskType: 'Project',
        academicPeriod: 'Finals',
        priority: 'Medium',
        status: 'Backlog',
        deadline: new Date(now + 35 * 24 * 60 * 60 * 1000),
        estimatedMinutes: 150,
        checklist: [
          { text: 'Write Dockerfile configuration', isDone: false },
          { text: 'Configure automated environment variables', isDone: false },
        ],
      },
    ];

    await Task.insertMany(tasks);
    console.log(`[Seeder] Created ${tasks.length} sample tasks across Prelims, Midterms, and Finals.`);
    console.log('[Seeder] Database seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]', error);
    process.exit(1);
  }
};

seedDemoData();
