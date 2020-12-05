const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  // exerciseId: String, // when updating an exercise, keep the exerciseId. viewed based on the timestamp
  courseId :  { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  parentId : { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
  title: String, // exercise title must follow exDD-DD format
  instruction: String,
  html: String,
  js: String,
  css: String,
  testcode: String,
  enablerunraw: Boolean
}, { timestamps: true });

const Exercise = mongoose.model('Exercise', exerciseSchema);

module.exports = Exercise;
