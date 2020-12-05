const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
    // exerciseId: String, // when updating an exercise, keep the exerciseId. viewed based on the timestamp
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName:String,
    title: String,
    topic:String,
    html: String,
    js: String,
    css: String,
    testcode: String,
    enablerunraw: Boolean
}, { timestamps: true });

const Forum = mongoose.model('Forum', forumSchema);

module.exports = Forum;
