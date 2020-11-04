const mongoose = require('mongoose');

const workSchema = new mongoose.Schema({
    // exerciseTitle: String, // relationship: Exercise.title XXX howto?
    class: {type:mongoose.Schema.Types.ObjectId, ref: 'Class'},
    student: {type:mongoose.Schema.Types.ObjectId, ref: 'User'},
    exercise: {type:mongoose.Schema.Types.ObjectId, ref: 'Exercise'},
    deadline: Date,
    html: {type: String, default: ''},
    css: {type: String, default: ''},
    js: {type: String, default: ''},
    hash: String, // hash of html+css+js
    savecount: Number
}, { timestamps: true });

const Work = mongoose.model('Work', workSchema);

module.exports = Work;
