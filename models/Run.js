const mongoose = require('mongoose');

const runSchema = new mongoose.Schema({
    work: {type:mongoose.Schema.Types.ObjectId, ref: 'Work'},
    combinedWork: String,
    hash: String,
}, { timestamps: true });

const Run = mongoose.model('Run', runSchema);

module.exports = Run;

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