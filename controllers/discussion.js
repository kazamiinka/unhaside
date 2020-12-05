const User = require('../models/User');
const Class = require('../models/Class');
const Exercise = require('../models/Exercise');
const Work = require('../models/Work');
const Quis = require('../models/Quis');
const Course = require('../models/Course');
const QuisStudent = require('../models/QuisStudent');
const Discussion = require('../models/Discussion');
const Forum = require('../models/Forum');
const Module = require('../models/Module');

/**
 * GET /
 * Home page.
 */
exports.index = async (req, res) => {
  if (req.user.role == 'student')
    return res.redirect('/student');

  var quisList = await Quis.find({}).exec();
  // console.log(exerciseList);
//   function(err, exerciseList) {
    return res.render('quis/list', {quis: quisList});
//   });
//   MyModel.find({ name: /john/i }, 'name friends', function (err, docs) { })
};


/**
 * GET /exercise/:exerciseId
 * get one exercise
 */
exports.getById = async (req, res) => {
  if (req.user.role == 'student')
    return res.redirect('/student');

  if (req.params.exerciseId === 'new') {
    return res.render('exercise/new', {
    });
  }
  try {
      var thisExercise = await Exercise.findById(req.params.exerciseId).exec();
      return res.render('exercise/edit', {title: thisExercise.title, ex: thisExercise});
  } catch(err) {
      console.log(err);
      res.status(500);
  }
};

exports.getQuisById = async (req, res) => {
    // console.log(req.params.quisId);
    try {
        var thisQuis = await Quis.findById(req.params.quisId).exec();
        var thisCourse = await Course.findById(req.params.courseId).exec();
        var thisQuisStudent = await QuisStudent.find({studentId : req.user.id}).exec();
        console.log(thisCourse);
        return res.render('quis/edit', {course:thisCourse, title: thisQuis.title, ex: thisQuis, courseTitle : thisCourse.title, courseId: req.params.courseId, quisId : req.params.moduleId});
    } catch (err) {
        console.log(err);
    }
}

exports.getDiscussionByModule = async (req, res) => {
  // console.log(req.params.quisId);
  try {
      var thisDiscussion = await Discussion.find({moduleId : req.moduleId}).exec();
      var thisCourse = await Course.findById(req.params.courseId).exec();
      var thisQuisStudent = await QuisStudent.find({studentId : req.user.id}).exec();
      console.log(thisQuisStudent );
      return res.render('quis/studentView', {title: thisQuis.title, ex: thisQuis, courseTitle : thisCourse.title, courseId: req.params.courseId, quisId : req.params.moduleId});
  } catch (err) {
      console.log(err);
  }
}

exports.getForumById = async (req, res) => {
    // console.log(req.params.quisId);
    try {
        // var thisDiscussion = await Discussion.find({moduleId : req.moduleId}).exec();
        var thisCourse = await Course.findById(req.params.courseId).exec();
        var thisForum = await Forum.findById(req.params.forumId).exec();
        var thisDiscussion = await Discussion.find({forumId : req.params.forumId},{},{ sort: { createdAt: -1 } }).exec();
        // console.log(thisQuisStudent );
        return res.render('discussion/studentView', {discussion:thisDiscussion,title: thisForum.title, ex: thisForum, courseTitle : thisCourse.title, courseId: req.params.courseId});
    } catch (err) {
        console.log(err);
    }
  }


exports.create = (req, res, next) => {

//   if (req.user.role == 'student')
//     return res.status(404).json({code:404});
  // var answer = Quis.find({courseId: req.course._id}).exec()
  
  var newDiscussion = new Discussion(req.body);
  // console.log(req.body)
  newDiscussion.save(function (err) {
      if (err)
        return res.status(500).json({code:500, error: err});
      return res.json({code:200});
  });
};

exports.createForum = (req, res, next) => {
 
    console.log("student")
  //   if (req.user.role == 'student')
  //     return res.status(404).json({code:404});
    // var answer = Quis.find({courseId: req.course._id}).exec()
    
    var newDiscussion = new Forum(req.body);
    // console.log(req.body)
    newDiscussion.save(function (err) {
        if (err)
          return res.status(500).json({code:500, error: err});
        return res.json({code:200});
    });
};
  

  exports.add = async (req, res) => {
    // console.log(req);
    // if (req.user.role == 'student')
    //   return res.redirect('/studentcourses');
    var thisDiscussion = await Discussion.find({parentId : req.params.moduleId},{},{ sort: { createdAt: -1 } }).exec();
    // var thisCourse = await Course.findById(req.params.courseId).exec();
    // var thisModule = await Module.findById(req.params.moduleId).exec();
   
    try {
      var thisDiscussion = await Discussion.find({parentId : req.params.moduleId},{},{ sort: { createdAt: -1 } }).exec();
    // var thisCourse = await Course.findById(req.params.courseId).exec();
    //   var thisModule = await Module.findById(req.params.moduleId).exec();
      var thisCourse = await Course.findById(req.params.courseId).exec();
      return res.render('discussion/add', {course: thisCourse });
  
    } catch (err) {
      console.log(thisCourse);
      res.status(500);
    }
  };

// exports.add = async (req, res) => {
// 	console.log(req);
//   // if (req.user.role == 'student')
//     return res.redirect('/discussion/add');

// //   try {
// //       var thisDiscussion = await Discussion.findById(req.params.courseId).exec();
// //       return res.render('quis/add', {ex: thisCourse});
// //   } catch(err) {
// //       console.log(thisCourse);
// //       res.status(500);
// //   }
// };


exports.updateById = (req, res, next) => {
  if (req.user.role == 'student')
    return res.status(404).json({code:404});

  Exercise.findByIdAndUpdate(req.params.exerciseId, req.body, function(err, doc) {
    // console.log(err, doc);
    if (err)
      return res.status(500).json({code:500, error: err});
    return res.json({code:200});
  });
};

exports.indexByStudent = async (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    try {
      const [workData, classData] = await Promise.all([
        Work.find({student: req.user._id}).exec(),
        Class.findOne({students:{$all: [req.user._id]}})
          .populate('exercises.exId').exec()
      ]);
      const exerciseData = classData.exercises.filter((e) => e.active).map((e)=> {e.exId.active = e.active; e.exId.deadline = e.deadline; return e.exId; }).sort((l,r) => l.title.localeCompare(r.title));
      // exerciseData.forEach((e) => {
      //   workData.filter((w) => w.exercise == e._id).sort((w) => w.updatedAt).reverse()[0]
      // });


      const splitTitleFunction = (ex1, ex2) => { return ex1.split('-')[0] != ex2.split('-')[0];}; // exercise title must follow exDD-DD format

      // console.log(exerciseData);

      const exerciseGroups = exerciseData.reduce((acc, cur, idx, arr) => {
        if (idx == 0 || splitTitleFunction(cur.title, arr[idx-1].title)) {
          acc.push({id: cur.title.split('-')[0], exercises:[cur]});
        }
        else {
          acc[acc.length-1].exercises.push(cur);
        }
        // console.log('splitE', idx, cur.title, idx ? arr[idx-1].title: null, acc);
        return acc;
      }, []);

      // console.log('exerciseGroup', exerciseGroups);

      return res.render('exercise/studentlist', {title: 'Exercises', exerciseGroups, inClass: true});
  }
  catch(e) {
    console.log('err', e);
    return res.render('exercise/studentlist', {title: 'Exercises', exerciseGroups: null, inClass: false});
  }

  }

  return res.status(404).json({code:404});
}
// middleware
exports.indexByStudentMiddleware = async (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    const [workData, classData] = await Promise.all([
      Work.find({student: req.user._id}).exec(),
      Class.findOne({students:{$all: [req.user._id]}})
        .populate('exercise').exec()
    ]);
    const exerciseData = classData.exercises;

    res.locals.exercises = exerciseData;
    res.locals.work = workData;

    return next();
  }

  next();
}

exports.deleteQuisById = (req, res) => {
  if (!(req.user.role === 'teacher' || req.user.role ==='admin'))
    return res.status(401).json({code:401, error: 'Wrong privilege'});
  
  Quis.findByIdAndRemove(req.params.quisId, function(err,doc) {
    if (err);
    return res.redirect('/course/' + req.params.courseId);
  });  
}
