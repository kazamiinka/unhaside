const mongoose = require('mongoose');

const runlogSchema = new mongoose.Schema({
    run: {type:mongoose.Schema.Types.ObjectId, ref: 'Run'},
    work: {type:mongoose.Schema.Types.ObjectId, ref: 'Work'},
    exercise: {type:mongoose.Schema.Types.ObjectId, ref: 'Exercise'},
    student: {type:mongoose.Schema.Types.ObjectId, ref: 'User'},
    clientIp: String,
    logs: []
}, { timestamps: true });

const Runlog = mongoose.model('Runlog', runlogSchema);

module.exports = Runlog;

/*
var BookSchema = new Schema(
  {
    title: {type: String, required: true},
    author: {type: Schema.ObjectId, ref: 'Author', required: true},
    summary: {type: String, required: true},
    isbn: {type: String, required: true},
    genre: [{type: Schema.ObjectId, ref: 'Genre'}]
  }
);
*/