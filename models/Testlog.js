const mongoose = require('mongoose');

const testlogSchema = new mongoose.Schema({
    work: {type:mongoose.Schema.Types.ObjectId, ref: 'Work'},
    exercise: {type:mongoose.Schema.Types.ObjectId, ref: 'Exercise'},
    student: {type:mongoose.Schema.Types.ObjectId, ref: 'User'},
    clientIp: String,
    logs: []
}, { timestamps: true });

const Testlog = mongoose.model('Testlog', testlogSchema);

module.exports = Testlog;
