const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
	title: String,
	course: String,
	order: Number,
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
	contributors : [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
	modules : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Modul' }],
    active: Boolean
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
