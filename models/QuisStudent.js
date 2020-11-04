const mongoose = require('mongoose');

const quisStudentSchema = new mongoose.Schema({
    // exerciseId: String, // when updating an exercise, keep the exerciseId. viewed based on the timestamp
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    quisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quis' },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    questionAnswer: [{
        ask: String,
        answer: [],
        score: Number,
    }],
    totalScore:Number,
    html: String,
    js: String,
    css: String,
    testcode: String,
    enablerunraw: Boolean
}, { timestamps: true });

const QuisStudent = mongoose.model('QuisStudent', quisStudentSchema);

module.exports = QuisStudent;
