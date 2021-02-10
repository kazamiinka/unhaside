const User = require('../models/User');
const Class = require('../models/Class');
const Exercise = require('../models/Exercise');
const Work = require('../models/Work');
const Worklog = require('../models/Worklog');
const Run = require('../models/Run');
const Runlog = require('../models/Runlog');
const Testlog = require('../models/Testlog');
const io = require('./socketio');
const Courses = require('../models/Class');
const Course = require('../models/Course');

/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  // console.log('user', req.user);

  if (req.user.role == 'student')
    return res.redirect('/student');

  Class.find(function(err, docs) {
    res.render('class/list', {title: 'Class List', classes: docs});
  });
};

exports.index2 = (req, res) => {
  // console.log('user', req.user);

  if (req.user.role == 'student')
    return res.redirect('/student');
  console.log(req.params.courseId);
  Class.find({courseId : req.params.courseId}, function(err, docs) {
    res.render('class/list', {title: 'Class List', classes: docs, courseId : req.params.courseId});
  });
};
/**
 * GET /classlog/:classId
 * get one class
 */
exports.getById = async (req, res) => {
  if (req.user.role == 'student')
    return res.redirect('/student');

  try {
    // console.log(arguments.callee, req.params.classId);
    // Class.findById(req.params.classId)
      // .populate({path:'staff',select:'_id email'})
      // .populate({path:'students',select:'_id email'})
      // .populate('exercises')
      // .exec(function(err, data) { return res.render('class/edit',{classData:data})});
    // return res.json(thisClass);

    var Classest = null
    Class.findById(req.params.classId, function(err, docs) {
      Classest = docs 
    });

    // console.log(Classest)
  
   const [classData, exerciseData, userData, courseData] = await Promise.all([
     Class.findById(req.params.classId).exec(),
     Exercise.find({}).sort('title').exec(),
     User.find({}).sort('email').exec(),
     Course.findById(req.params.courseId).exec()
    ]);

    

    // var thisCourse = null
    // Courses.findById(classData.courseId, function(err, docs) {
    //   thisCourse = docs 
    // });

    // console.log(thisCourse)

    // console.log(classData.courseId)
   // console.log(classData.students);
  //  console.log(classData.students.indexOf("5c6668e02e119453e3b43d61"));
    var students = userData.filter((s) => s.role === 'student')
      .map((s) => { 
        s=Object.assign({},s._doc);
        s.inClass = classData.students.indexOf(s._id)>=0;
        return s;
      })
      .sort((l, r) => {
        if (l.inClass === true && r.inClass === false) {
          return -1;
        }
        if (l.inClass === false && r.inClass === true) {
          return 1;
        }
        return l.email.localeCompare(r.email);    
      });
    var assistants = userData.filter((s) => s.role === 'assistant')
      .map((s) => { 
        s=Object.assign({},s._doc);
        s.inClass = classData.staff.indexOf(s._id)>=0;
        return s;

      });
    var teachers = userData.filter((s) => s.role === 'teacher')
      .map((s) => { 
        s=Object.assign({},s._doc);
        s.inClass = classData.staff.indexOf(s._id)>=0;
        return s;
      });
      // console.log(teachers);
    var exercises = exerciseData
      .map((s) => { 
        s=Object.assign({active: false, deadline: ''},s._doc);
        // console.log('s', s);
        try {
          var d = (({active, deadline}) => ({active, deadline}))(classData.exercises.find((k)=> {return String(s._id) == String(k.exId)}));
          s = Object.assign(s, d);
          // s = Object.assign(s, (({active, deadline}) => {active, deadline})(classData.exercises.find((k)=> {return String(s._id) == String(k.exId)})) );
          // console.log('match', s, d);//classData.exercises.find((k)=> {return String(s._id) == String(k.exId)}));
        }
        catch(err) {}
        // s.inClass = classData.exercises.indexOf(s._id)>=0;
        // s.displayed = classData.displayedExercises.indexOf(s._id)>=0;
        return s;
      });

      

    // console.log(teachers, assistants, students, exercises);

    // res.json({teachers, assistants, students, exercises});
    // var thisCourse = Courses.findById('5e37b6f9d37b3942dc4fbb8f').exec();
    // console.log(thisCourse)
    return res.render('class/edit', { title: 'Edit Class',
      courseData,classData, teachers, assistants, students, exercises
    });
  } catch(err) {
    return res.status(500);
  }
    // if (req.isAuthenticated()) {
    //   return res.redirect('/');
    // }
}

exports.getAllClassCourse = async (req, res) => {

  var classes = await Class.find({courseId: req.params.courseId}).exec();
  var thisCourse = await Course.findById(req.params.courseId).exec();
  
  return res.render('class/allClass', {title: thisCourse.title, classes: classes, courseId : req.params.courseId});

}

exports.logIndex = (req, res) => {
  if (req.user.role == 'student')
    return res.redirect('/student');

  Class.find(function(err, docs) {
    res.render('class/loglist', {title: 'Class Log List', classes: docs});
  });
};

exports.deleteById = (req, res) => {
  //if (req.user.role !== 'teacher')
    //return res.status(401).json({code:401, error: 'Wrong privilege'});
  var Classest = null
  Class.findById(req.params.classId, function(err, docs) {
    Classest = docs 
  });
  Class.findByIdAndRemove(req.params.classId, function(err,doc) {
    if (err);
  
    return res.redirect('/course/');

  });  
}

exports.getLogsById = async (req, res) => {
  if (req.user.role == 'student')
    return res.redirect('/student');

  try {
    // console.log(req.params.classId);
    var classData = await Class.findById(req.params.classId).exec();
    return res.render('class/logstats', {
      title: `Class Log Stats ${classData.classId}`,
      classId: req.params.classId,
      classTitle: classData.classId,
      userId: req.user._id,
    });
  } catch(err) {
    return res.status(500);
  }
    // if (req.isAuthenticated()) {
    //   return res.redirect('/');
    // }
}

exports.getStaffworkById = async (req, res) => {
  if (req.user.role == 'student')
    return res.redirect('/student');

  try {
    // console.log(req.params.classId);
    var classData = await Class.findById(req.params.classId).exec();
    return res.render('class/staffwork', {
      title: `Class ${classData.classId}`,
      classId: req.params.classId,
      classTitle: classData.classId,
      userId: req.user._id,
    });
  } catch(err) {
    return res.status(500);
  }
    // if (req.isAuthenticated()) {
    //   return res.redirect('/');
    // }
}

/**
 * GET /classlogs-stats/:classId/:timestamp
 * get the logs of one class
 */
exports.getLogsStatsById = async (req, res) => {
  // if (req.user.role == 'student')
  //   return res.redirect('/student');

  try {
    const classData = await Class.findById(req.params.classId)
        .populate('exercises.exId', 'title')
        .populate('staff')
        .populate('students')
        .exec();

    const threeHoursAgo = Date.now() - 3*3600000;
    const studentIdList = classData.students.map((s) => s._id);

    const timestamp = Number(req.params.timestamp) || 0;

    const [worklogData, runlogData, testlogData] = await Promise.all([
        Worklog.find().in('student', studentIdList)
          .gt('updatedAt', timestamp)
          .sort('updatedAt')
          // .populate('work', 'hash')
          .exec(),
        Runlog.find().in('student', studentIdList)
          // .gt('updatedAt', threeHoursAgo)
          .gt('updatedAt', timestamp)
          // .populate('run', 'hash')
          .sort('updatedAt')
          .exec(),
        Testlog.find().in('student', studentIdList)
          // .gt('updatedAt', threeHoursAgo)
          .gt('updatedAt', timestamp)
          // .populate('run', 'hash')
          .sort('updatedAt')
          .exec(),
    ]);
    
    worklogs.init(worklogData)
    runlogs.init(runlogData)
    testlogs.init(testlogData)

    // https://stackoverflow.com/questions/17781472/how-to-get-a-subset-of-a-javascript-objects-properties

    return res.json({classData,
                    worklogs:(({latestWork, stats}) => ({latestWork, stats}))(worklogs),
                    runlogs:(({latestRun, stats}) => ({latestRun, stats}))(runlogs),
                    testlogs:(({latestTest, stats}) => ({latestTest, stats}))(testlogs)
    });

  } catch(err) {
    return res.status(500);
  }
    // if (req.isAuthenticated()) {
    //   return res.redirect('/');
    // }
}

exports.create = (req, res, next) => {
  // if (req.user.role !== 'teacher')
  //   return res.status(401).json({code:401, error: 'Wrong privilege'});
    
  var newClass = new Class(req.body);
  newClass.save(function (err) {
      if (err)
        console.log(err);
        return res.status(500).json({code:500, error: err});
      return res.json({code:200});
  });
}

exports.updateById = (req, res, next) => {
  if (req.user.role !== 'teacher')
    return res.status(401).json({code:401, error: 'Wrong privilege'});

  Class.findByIdAndUpdate(req.params.classId, req.body, function(err, doc) {
    // console.log(err, doc);
    if (err)
      return res.status(500).json({code:500, error: err});
    return res.json({code:req.params.classId});
  });
}

exports.editById = (req, res, next) => {
   if (req.user.role !== 'teacher')
    return res.status(401).json({code:401, error: 'Wrong privilege'});

   return res.render('home',{
      title: 'Home'
    });
}
// -- utilities for getLogsStatsById
// must be synched with class-log-stats

let worklogs = {
  data: {},
  stats: {},
  latestWork: {},
  initialized: false,
  updated: false,
  init: function(wl) {
      this.data = {};
      this.stats = {};
      this.latestWork = {};
      wl.forEach((w) => this.add(w));
      this.initialized = true;
      return this.data;
  },
  add: function(w) {
      if (!this.data[w.student]) {
          this.data[w.student] = {};
          this.stats[w.student] = {};
      }

      this.latestWork[w.student] = (({exercise, clientIp, updatedAt}) => ({exercise, clientIp, updatedAt}))(w);

      if (!this.data[w.student][w.exercise]) {
          this.data[w.student][w.exercise] = [w];
          this.stats[w.student][w.exercise] = {
              savecount: 0, // number of saves
              pastecount: 0, // number of pastes
              pasteChars: 0, // total characters of pastes
              clientIp: 0, //w.clientIp, // last ip address
              updatedAt: 0, //w.updatedAt, // last save time
              firstSavedAt: 0,
            };
      }

      this.stats[w.student][w.exercise].savecount = w.savecount >= 0 ? w.savecount : this.stats[w.student][w.exercise].savecount; // number of saves
      this.stats[w.student][w.exercise].clientIp = w.clientIp;
      if (w.savecount == -1) {
          var pastes = w.logs.filter((l) => l.type == 'paste')
          var pasteLength = pastes.reduce((acc,cur) => acc + cur.text.length, 0)
          this.stats[w.student][w.exercise].pastecount += pastes.length; // number of pastes
          this.stats[w.student][w.exercise].pasteChars += pasteLength; // total characters of pastes
      }
      else {
          this.stats[w.student][w.exercise].updatedAt = w.updatedAt;
          if (this.stats[w.student][w.exercise].firstSavedAt == 0)
            this.stats[w.student][w.exercise].firstSavedAt = w.updatedAt;
}
      // console.log('stats', this.stats[w.student][w.exercise], w);
      this.updated = true;
      return w;
  },
}

let runlogs = {
  data: {},
  stats: {},
  latestRun: {},
  initialized: false,
  updated: false,
  init: function(rl) {
    this.data = {};
    this.stats = {};
    this.latestWork = {};
    rl.forEach((r) => this.add(r));
      this.initialized = true;
      return this.data;
  },
  add: function(r) {
      // r : {... logs: [...] }
      if (!this.data[r.student]) {
          this.data[r.student] = {};
          this.stats[r.student] = {};
      }

      this.latestRun[r.student] = (({exercise, clientIp, updatedAt}) => ({exercise, clientIp, updatedAt}))(r);

      let errors = r.logs.filter((l) => l[1].search('Error') >= 0).length;
      let functionCalls = r.logs.filter((l) => l[1] === 'element' && l[3] === 'start').length;

      if (!this.data[r.student][r.exercise]) {
          this.data[r.student][r.exercise] = [r];

          this.stats[r.student][r.exercise] = {
              runs: 1, // number of runs
              errors: errors, // number of errors on the last run
              functionCalls: functionCalls, // number of function calls on the last run
              clientIp: r.clientIp, // last ip address
              updatedAt: r.updatedAt, // last run update time
              firstRunAt: r.updatedAt, // first run time
          }
      }
      else {
          this.stats[r.student][r.exercise].clientIp = r.clientIp;
          this.stats[r.student][r.exercise].updatedAt = r.updatedAt;

          var studentLog = this.data[r.student][r.exercise];
          if (studentLog[studentLog.length-1].run == r.run) {
              // studentLog[studentLog.length-1].logs = studentLog[studentLog.length-1].logs.concat(r.logs);

              this.stats[r.student][r.exercise].errors += errors;
              this.stats[r.student][r.exercise].functionCalls += functionCalls;
          }
          else {
              studentLog.push(r);
              if (studentLog.length > 1)
                  studentLog.shift();
              // new run; add run counts, 
              this.stats[r.student][r.exercise].runs++;
              this.stats[r.student][r.exercise].errors = errors;
              this.stats[r.student][r.exercise].functionCalls = functionCalls;
          }
      }
      // console.log('stats', this.stats[r.student][r.exercise], errors, functionCalls, r.logs)
      this.updated = true;
      return r;
  },
}

let testlogs = {
  data: {},
  stats: {},
  latestTest: {},
  initialized: false,
  updated: false,
  init: function(tl) {
    this.data = {};
    this.stats = {};
    this.latestWork = {};
    tl.forEach((r) => this.add(r));
      this.initialized = true;
      return this.data;
  },
  add: function(t) {
      // t : {... logs: [...] }
      if (!this.data[t.student]) {
          this.data[t.student] = {};
          this.stats[t.student] = {};
      }

      this.latestTest[t.student] = t;

      let testResults = t.logs[2]
      let errors = Object.keys(testResults).filter((l) => testResults[l] == false);

      if (!this.data[t.student][t.exercise]) {
          this.data[t.student][t.exercise] = [t];

          this.stats[t.student][t.exercise] = {
              tests: 1, // number of tests
              errors: errors, // errors on the last test
              clientIp: t.clientIp, // last ip address
              updatedAt: t.updatedAt, // last test update time
              firstPassAt: errors.length ? 0 : t.updatedAt, // test passes the first time
          }
      }
      else {
          this.stats[t.student][t.exercise].clientIp = t.clientIp;
          this.stats[t.student][t.exercise].updatedAt = t.updatedAt;
          this.stats[t.student][t.exercise].tests++;
          this.stats[t.student][t.exercise].errors = errors;
          this.stats[t.student][t.exercise].firstPassAt = errors.length ? 0 : t.updatedAt;
      }
      // console.log('stats', this.stats[t.student][t.exercise], errors, functionCalls, t.logs)
      this.updated = true;
      return t;
  },
}