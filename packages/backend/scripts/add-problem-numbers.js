// packages/backend/scripts/add-problem-numbers.js
// Run with: node scripts/add-problem-numbers.js

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in environment variables');
  process.exit(1);
}

async function addProblemNumbers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const Problem = mongoose.model('Problem', new mongoose.Schema({
      problemNumber: { type: Number, unique: true, sparse: true },
      title: String,
      // ... other fields
    }, { collection: 'problems' }));

    // Find all problems without a problemNumber
    const problems = await Problem.find({ problemNumber: { $exists: false } })
      .sort({ createdAt: 1 });

    console.log(`📊 Found ${problems.length} problems without numbers`);

    let currentNumber = 1;
    
    // Find the highest existing problem number
    const lastProblem = await Problem.findOne({ problemNumber: { $exists: true } })
      .sort({ problemNumber: -1 });
    
    if (lastProblem) {
      currentNumber = lastProblem.problemNumber + 1;
    }

    console.log(`📝 Starting from number ${currentNumber}`);

    // Update each problem with a number
    for (const problem of problems) {
      problem.problemNumber = currentNumber;
      await problem.save();
      console.log(`✅ Assigned #${currentNumber} to "${problem.title}"`);
      currentNumber++;
    }

    console.log(`✅ Migration complete! Assigned numbers to ${problems.length} problems`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addProblemNumbers();