const mongoose = require('mongoose');

const staffworklogSchema = new mongoose.Schema({
    classId: {type:mongoose.Schema.Types.ObjectId, ref: 'Class'},
    userId: {type:mongoose.Schema.Types.ObjectId, ref: 'User'},
    logs: {type: Array, default: []},
    stats: {type:mongoose.Schema.Types.Mixed}
}, { timestamps: true });

const Staffworklog = mongoose.model('Staffworklog', staffworklogSchema);

module.exports = Staffworklog;

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