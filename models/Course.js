const { text } = require('body-parser');
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
	title: String,
	course: String,
	order: Number,
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
	contributors : [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
	modules : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Modul' }],
	active: Boolean,
	status:Boolean,
	semester:String,
	status:Boolean,
	image:String,
	description: String 
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
