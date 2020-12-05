const mongoose = require('mongoose');

const quisSchema = new mongoose.Schema({
    // exerciseId: String, // when updating an exercise, keep the exerciseId. viewed based on the timestamp
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    title: String, // exercise title must follow exDD-DD format
    instruction: String,
    question: [{
        ask: String,
        answer: String,
        score: Number,
        optionAnswer: [{
            option:String,
            multiple:String,
            isAnswer:Boolean,
            id_answer:String
        }],
    }],
    html: String,
    js: String,
    css: String,
    testcode: String,
    enablerunraw: Boolean
}, { timestamps: true });

const Quis = mongoose.model('Quis', quisSchema);

module.exports = Quis;
