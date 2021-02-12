// const mongoose = require('mongoose');

// const classSchema = new mongoose.Schema({
// 	courseId: { type:mongoose.Schema.Types.ObjectId, ref: 'Course' },
//     classId: { type: String, unique: true },
//     staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//     // exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }],
//     // displayedExercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }],
//     students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
// }, { timestamps: true });

// const Class = mongoose.model('Class', classSchema);

// module.exports = Class;
const mongoose = require('mongoose');

const subdocSchema = new mongoose.Schema({
    exId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
    active: Boolean,
    deadline: Date,
});

subdocSchema.pre('validate', function(next) {
    next();
});

const classSchema = new mongoose.Schema({
	courseId : { type:mongoose.Schema.Types.ObjectId, ref: 'Course' },
    classId: {type: String, unique: true},
    staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }],
    // displayedExercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    exercises: [{type: subdocSchema}],
    semester: String,
    tahun:Number,
    status:Boolean
}, { timestamps: true });

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
