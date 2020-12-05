const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
    // exerciseId: String, // when updating an exercise, keep the exerciseId. viewed based on the timestamp
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    forumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Forum' },
    userName:String,
    comment: String,
    commentChild:[{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment:String,
        createAdd:Date
    }],
    html: String,
    js: String,
    css: String,
    testcode: String,
    enablerunraw: Boolean
}, { timestamps: true });

const Discussion = mongoose.model('Discussion', discussionSchema);

module.exports = Discussion;
