const dotenv = require('dotenv');
dotenv.load({ path: '.env.example' });

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

const User = require('./models/User');
const Class = require('./models/Class');
const Exercise = require('./models/Exercise');
const Work = require('./models/Work');
const Run = require('./models/Run');
const Runlog = require('./models/Runlog');
const Worklog = require('./models/Worklog');

