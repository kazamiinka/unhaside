const User = require('../models/User');
const Class = require('../models/Class');
const Exercise = require('../models/Exercise');
const Work = require('../models/Work');
const Worklog = require('../models/Worklog');
const Run = require('../models/Run');
const Runlog = require('../models/Runlog');
const io = require('./socketio');

// for testing clients purposes
const mongoose = require('mongoose');
// const worklog = require('./worklog');
// const runlog = require('./runlog');
const md5 = require('blueimp-md5')

const dotenv = require('dotenv');
dotenv.load({ path: '../.env.example'});

var cd;
var ew;
const connectDb = () => {
  mongoose.Promise = global.Promise;
  mongoose.connect(process.env.MONGODB_URI);
  mongoose.connection.on('error', (err) => {
    console.error(err);
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
  });
  setTimeout(async () => {
    cd = await getLogsData(0);
    ew = generateExerciseWorks(cd.classData);
    console.log('get classData');
  }, 2000);
}

const getLogsData = async (timestamp) => {
  try {
    const classData = await Class.findOne({})
        .populate('displayedExercises', 'title')
        .populate('staff')
        .populate('students')
        .exec();

    const threeHoursAgo = Date.now() - 3*3600000;
    const studentIdList = classData.students.map((s) => s._id);

    const [worklogData, runlogData] = await Promise.all([
        Worklog.find().in('student', studentIdList)
          .gt('updatedAt', timestamp)
          .sort('updatedAt')
          // .populate('work', 'hash')
          .exec(),
        Runlog.find().in('student', studentIdList)
          .gt('updatedAt', timestamp)
          .populate('run', 'hash')
          .sort('updatedAt')
          .exec(),
    ]);

    // return res.json({worklogByStudent, runlogByStudent});
    return {classData, worklogData, runlogData};

  } catch(err) {
    return {err}
  }
}

const generate_worklog = (w, save) => {
  if (!save)
    return Object.assign({_id: new mongoose.Types.ObjectId, createdAt: new Date(), updatedAt: new Date()},
        {
          savecount: -1,
          logs: [
            {
              type: "paste",
              text: "-=-x = 0;\n\nfunction fx() {\n    console.log(x);\n}",
              timestamp: Date.now() - 5000
            },
            {
              type: "paste",
              text: "-=-x = 0;\n\nfunction fx() {\n    console.log(x);\n}",
              timestamp: Date.now() - 2000
            }
          ],
          _id: new mongoose.Types.ObjectId,
          html: "<!DOCTYPE html>\n<html>\n    <head>\n        \n    </head>\n    <body>\n        \n    </body>\n</html>",
          css: '',
          js: 'var x = 0',
          clientIp: '::1',
        },
        w
      );
  else
    return Object.assign({_id: new mongoose.Types.ObjectId, createdAt: new Date(), updatedAt: new Date(), __v: 0},
        {
          logs: [],
          _id: new mongoose.Types.ObjectId,
          html: "<!DOCTYPE html>\n<html>\n    <head>\n        \n    </head>\n    <body>\n        \n    </body>\n</html>",
          css: '',
          js: 'var x = 0',
          clientIp: '::1',
        },
        w
      );
}

const randomWorklog = (studentWorks) => {
  var thisWork = studentWorks[Math.floor(Math.random()*studentWorks.length)];
  var w = {
    exercise: thisWork.exercise,
    work: thisWork.work,
    student: thisWork.student,
    hash: thisWork.hash
  };

  if (Math.random() < 0.6) {
    // save
    w.savecount = ++thisWork.savecount;
    w.hash = thisWork.hash = md5(''+Date.now());
    return generate_worklog(w, true);
  }
  else {
    // paste
    return generate_worklog(w, false);
  }
}

const generate_runlog = (r) => {
  const randVal = Math.random();
  const now = Date.now();

  var logs;
  if (randVal < 0.2) { // domError
    logs = [
      [
        now - 2000,
        "domError",
        [
          "Uncaught SyntaxError: Unexpected token -=",
          "http://localhost:8080/run/work/5ade598bbce25004187a9bfb?time=1524522043883",
          "12",
          "1",
          "SyntaxError: Unexpected token -="
        ]
      ]
    ];
  }
  else if (randVal < 0.4) { // runtimeError global
    logs = [
      [
        now - 2000,
        "runtimeError",
        "script",
        "ReferenceError: a is not defined"
      ]
    ];
  }
  else if (randVal < 0.6) { // runtimeError in function
    logs = [
      [
        now - 1990,
        "element",
        "<p onclick=\"fx(1)\">",
        "start",
        "click",
        "fx",
        "onclick",
        [1],
        "3,0,7,1",
        {y: 3},
        []
      ],
      [
        now - 1995,
        "log",
        [4],
        {y: 3},
        []
      ],
      [
        now - 2000,
        "runtimeError",
        "fx",
        "ReferenceError: d is not defined"
      ]
    ];
  }
  else {
    logs = [
      [
        1524875758620,
        "element",
        "<p onclick=\"fx(2)\">",
        "start",
        "click",
        "fx",
        "onclick",
        [2],
        "3,0,6,1",
        {y: 3},
        []
      ],
      [
        1524875758620,
        "log",
        [5],
        {y: 3},
        []
      ],
      [
        1524875758621,
        "element",
        "<p onclick=\"fx(2)\">",
        "end",
        "click",
        "fx",
        "onclick",
        [2],
        "3,0,6,1",
        {y: 4},
        []
      ]
    ];
  }
  return Object.assign({_id: new mongoose.Types.ObjectId, createdAt: new Date(), updatedAt: new Date(), __v: 0, logs: logs, clientIp: '::1'}, r);
}

const randomRunlog = (studentWorks) => {
  var thisWork = studentWorks[Math.floor(Math.random()*studentWorks.length)];
  var w = {
    work: thisWork.work,
    student: thisWork.student,
    run: thisWork.run,
    exercise: thisWork.exercise,
  };

  if (Math.random() < 0.2) {
    // new run
    w.run = thisWork.run = new mongoose.Types.ObjectId;
  }
  return generate_runlog(w)  
}

const generateExerciseWorks = (classData) => {
  const students = classData.students;
  const exercises = classData.displayedExercises;

  var studentWorks = [];

  students.forEach((s) => {

    exercises.forEach((e) => {
      var wid = new mongoose.Types.ObjectId;

      var workData = {
        student: s._id,
        exercise: e._id,
        work: wid,
        savecount: 1,
        hash: md5(wid),
        run: new mongoose.Types.ObjectId
      };
      studentWorks.push(workData);
    });
  });

  return studentWorks;
}

var ivalTimer;
exports.testClassLogUpdates = (classData, stop) => {
  if (stop) {
    clearInterval(ivalTimer);
    ivalTimer = 0;
    return;
  }

  if (ivalTimer)
    return;

  var ew = generateExerciseWorks(classData);

  ivalTimer = setInterval(() => {
    if (Math.random() < 0.5) {
      io.get().emit('runlog', randomRunlog(ew));
    }
    else {
      io.get().emit('worklog', randomWorklog(ew));
    }
  }, 700);
}

