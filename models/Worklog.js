const mongoose = require('mongoose');

const worklogSchema = new mongoose.Schema({
    exercise: {type:mongoose.Schema.Types.ObjectId, ref: 'Exercise'},
    work: {type:mongoose.Schema.Types.ObjectId, ref: 'Work'},
    student: {type:mongoose.Schema.Types.ObjectId, ref: 'User'},
    clientIp: String,
    html: String,
    css: String,
    js: String,
    hash: String,
    savecount: {type: Number, default: -1},
    logs: {type: Array, default: []}
}, { timestamps: true });

const Worklog = mongoose.model('Worklog', worklogSchema);

module.exports = Worklog;

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