const mongoose = require('mongoose');

const subdocSchema = new mongoose.Schema({
    exId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
    active: Boolean,
    deadline: Date,
});

subdocSchema.pre('validate', function(next) {
    next();
});

const moduleSchema = new mongoose.Schema({
    courseId : { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
	titleModule: String,
	module: String,
	order: Number,
	editor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
	exercises : [{ type: subdocSchema }], 
    active: Boolean,
}, { timestamps: true });

const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;