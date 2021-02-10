const User = require('../models/User');
const Class = require('../models/Class');
const Exercise = require('../models/Exercise');
const Work = require('../models/Work');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Quis = require('../models/Quis');
const QuisStudent = require('../models/QuisStudent');
const Discussion = require('../models/Discussion');
const Forum = require('../models/Forum');

exports.indexByStudent = async (req, res) => {

  const [workData, classData] = await Promise.all([
    Work.find({ student: req.user._id }).exec(),
    Class.find({ students: { $all: [req.user._id] } })
      .populate('courseId').exec()
  ]);

  const coursesData = classData.map((e) => { return e.courseId; });
  console.log(coursesData);

  var d = new Date();
  var n = d.getMonth();
  var currentSemester = n > 8 ? 'ganjil' : 'genap'
  var courseList = await Course.find({$or: [{semester: currentSemester}, {status: 1}]}, {}, { sort: { order: 1 } }).exec();
  return res.render('course/studentlist', { courses: courseList, title: 'My Courses' });
}

exports.getByStudent = async (req, res) => {

}

exports.livecourses = async (req, res) => {

  var thisCourse = await Course.findById(req.params.courseId).exec();

  return res.render('course/livecourses', {
    title: thisCourse.title
  });
};

exports.previewModuleById = async (req, res) => {
  var thisCourse = await Course.findById(req.params.courseId).exec();
  var thisModules = await Module.findById(req.params.moduleId).exec();
  var Modules = await Module.find({ courseId: req.params.courseId }).exec();
  var Quises = await Quis.find({ courseId: thisCourse.id }).exec();
  var QuisesStudent = await QuisStudent.find({studentId:req.user.id}).exec();
  var isAlreadyAnswer = QuisesStudent.length > 0
  var thisDiscussion = await Discussion.find({moduleId : req.moduleId}).exec();
  var thisForum = await Forum.find({courseId : req.params.courseId},{},{ sort: { createdAt: -1 } }).exec();
  var thisExercise = await Exercise.find({courseId: req.params.courseId},{},{ sort: { createdAt: -1 } }).exec();
  // console.log(thisModules)
  const [workData, classData] = await Promise.all([
    Work.find({student: req.user._id}).exec(),
    Class.findOne({students:{$all: [req.user._id]}})
      .populate('exercises.exId').exec()
  ]);

  // var isAssign = false
  // classData.studenteach(function(){
    // if($(this) == req.user.id){
    //   isAssign = true
    // }
  //   console.log($(this))
  // })

  // console.log(isAssign)
  // var Classest = await Class.findAllById({ courseId : req.params.courseId }).exec();
  var Classest = null
  Class.find({ courseId: req.params.courseId }, function (err, docs) {
    Classest = docs
  });
  return res.render('course/studentmodulelist', { thisForum:thisForum,thisModules : thisModules, ex:thisCourse, idCourse: thisCourse.id, title: thisCourse.title, modules: Modules, classest: Classest, quisest: Quises, isAlreadyAnswer:isAlreadyAnswer, discussion:thisDiscussion, exercise:thisExercise, classExercise:classData });
}

exports.previewModuleById2 = async (req, res) => {
  // var thisCourse = await Course.findById(req.params.courseId).exec();
  // var Modules = await Module.find({ courseId : req.params.courseId }).exec();
  // console.log(Modules);   
  // console.log(thisCourse);
  // return res.render('course/studentmodulelist', {title: thisCourse.title, modules : Modules});
  try {
    console.log(req.params.moduleId)
    var thisDiscussion = await Discussion.find({parentId : req.params.moduleId},{},{ sort: { createdAt: -1 } }).exec();
    var thisCourse = await Course.findById(req.params.courseId).exec();
    var thisModule = await Module.findById(req.params.moduleId).exec();
    var thisForum = await Forum.find({courseId : req.params.courseId},{},{ sort: { createdAt: -1 } }).exec();
    return res.render('course/preview', {thisForum:thisForum, discussion:thisDiscussion,title: thisModule.titleModule, ex: thisModule, course:thisCourse });
  } catch (err) {
    console.log(thisCourse);
    res.status(500);
  }
}

exports.previewModuleList = async (req, res) => {
 
  console.log(req.params.courseId)
  // console.log("lllll")
  var Modules = await Module.find({ courseId: req.params.courseId }).exec();
  var thisCourse = await Course.findById(req.params.courseId).exec();

  return res.render('course/previewModuleList', {modules:Modules, ex:thisCourse});
}

exports.index = async (req, res) => {
  if (req.user.role == 'student')
    return res.redirect('/studentcourses');

  var d = new Date();
  var n = d.getMonth();
  var currentSemester = n > 8 ? 'ganjil' : 'genap'
  // var courseList = await Course.find({semester:currentSemester, status:1}, {}, { sort: { order: 1 } }).exec();
  var courseList = await Course.find({}, {}, { sort: { order: 1 } }).exec();
  // console.log(exerciseList);
  //   function(err, exerciseList) {
  return res.render('course/list', { courses: courseList, title: 'Course List' });
  //   });
  //   MyModel.find({ name: /john/i }, 'name friends', function (err, docs) { })
};




exports.create = (req, res, next) => {
  if (!(req.user.role === 'teacher' || req.user.role === 'admin'))
    return res.status(401).json({ code: 401, error: 'Wrong privilege' });

  var newCourse = new Course(req.body);
  newCourse.save(function (err) {
    if (err)
      return res.status(500).json({ code: 500, error: err });
    return res.json({ code: 200 });
  });
}

exports.createModule = (req, res, next) => {
  if (!(req.user.role === 'teacher' || req.user.role === 'admin'))
    return res.status(401).json({ code: 401, error: 'Wrong privilege' });
  // return res.json({code:200});
  // return res.json( req.body );
  var newModule = new Module(req.body);
  newModule.save(function (err) {
    if (err)
      return res.status(500).json({ code: 500, error: err });
    return res.json({ code: 200 });
  });
}

exports.createExercise = (req, res, next) => {
  if (!(req.user.role === 'teacher' || req.user.role === 'admin'))
    return res.status(401).json({ code: 401, error: 'Wrong privilege' });
  // return res.json({code:200});
  // return res.json( req.body );
  var newExercise = new Exercise(req.body);
  newExercise.save(function (err) {
    if (err)
      return res.status(500).json({ code: 500, error: err });
    return res.json({ code: 200 });
  });

}

exports.getById = async (req, res) => {
  // console.log(req);
  if (req.user.role == 'student')
    return res.redirect('/studentcourses');

  const [classData, exerciseData, userData, moduleData, classList, exerciseList, quisList] = await Promise.all([
    Class.findById(req.params.classId).exec(),
    Exercise.find({}).sort('title').exec(),
    User.find({}).sort('email').exec(),
    Module.find({ courseId: req.params.courseId }).exec(),
    Class.find({ courseId: req.params.courseId }).exec(),
    Exercise.find({ courseId: req.params.courseId }).exec(),
    Quis.find({ courseId: req.params.courseId }).exec(),
  ]);
  console.log("classData");
  var thisForum = await Forum.find({courseId : req.params.courseId},{},{ sort: { createdAt: -1 } }).exec();
  // 
  console.log(req.params.courseId);
  var teachers = userData.filter((s) => s.role === 'teacher')
    .map((s) => {
      s = Object.assign({}, s._doc);
      if (classData != null)
        s.inClass = classData.staff.indexOf(s._id) >= 0;
      a = JSON.stringify(s._id);
      b = JSON.stringify(req.user._id);
      if (a == b) s.disabled = true;
      return s;
    });
  var modules = moduleData;
  var classes = classList;
  var exercises = exerciseList;
  var quis = quisList;
  var currentDate = new Date()
  var currentYear = currentDate.getFullYear()
  var lastTeenYear = currentYear - 10
  var listYear = []
  for(i=lastTeenYear;i<=currentYear+10; i++){
    listYear.push(i+1)
  }

  var d = new Date();
  var n = d.getMonth();
  var currentSemester = n > 8 ? 'ganjil' : 'genap'

  var classBySemesterandYear = await Class.find({$and: [{semester: currentSemester}, {tahun: currentYear}]}, {}, { sort: { order: 1 } }).exec();


  try {
    var thisCourse = await Course.findById(req.params.courseId).exec();
    var author = await User.findById(thisCourse.author).exec();
    return res.render('course/edit', { forum:thisForum,title: thisCourse.title, ex: thisCourse, teachers, modules, idCourse: req.params.courseId, author: author.profile.name, classes, exercises, quis, listYear:listYear, currentYear:currentYear, classBySemesterandYear:classBySemesterandYear });
  } catch (err) {
    console.log(thisCourse);
    res.status(500);
  }
};

exports.getModuleById = async (req, res) => {
  // console.log(req.params.moduleId);
  try {

    var thisModule = await Module.findById(req.params.moduleId).exec();
    var thisCourse = await Course.findById(req.params.courseId).exec();
    console.log(thisModule);
    return res.render('course/editmodule', { title: thisModule.titleModule, ex: thisModule, courseTitle: thisCourse.title, courseId: req.params.courseId, moduleId: req.params.moduleId });
  } catch (err) {
    console.log(err);
  }
}


exports.getExerciseByCourse = async (req, res) => {
  try {
    // console.log(req.params);
    var thisCourse = await Course.findById(req.params.courseId).exec();
    var thisExercises = await Exercise.find({ courseId: req.params.courseId }).populate('parentId').exec();

    // Query for add data module 
    var thisModules = await Module.find({ $or: [{ courseId: req.params.courseId }, { titleModule: 'None' }] }).exec();

    var Modules = await Module.find({ courseId: req.params.courseId }).exec();
    // console.log(Modules);
    console.log(thisExercises);
    return res.render('course/exerciseslist',
      {
        title: thisCourse.title,
        ex: thisCourse,
        exercises: thisExercises,
        thisModules: thisModules
      });
  } catch (err) {
    console.log(err);
  }
}

exports.getExerciseById = async (req, res) => {
  try {
    var thisCourse = await Course.findById(req.params.courseId).exec();
    var thisExercise = await Exercise.findById(req.params.exerciseId).exec();
    var thisModules = await Module.find({ $or: [{ courseId: req.params.courseId }, { titleModule: 'None' }] }).exec();
    var modules = await Module.find({courseId : req.params.courseId}).exec();
    // var thisCourse = await Course.find(req.params.courseId).exec();

  
    return res.render('course/editexercise', {
      title: '', ex: thisExercise, thisCourse, thisModules, courseId: req.params.courseId, exerciseId: req.params.exerciseId
    }); 
  } catch (err) {
    console.log(err);
  }
}

exports.previewById = async (req, res) => {
  console.log(req);
  // if (req.user.role == 'student')
  //   return res.redirect('/studentcourses');

  try {
    var thisCourse = await Course.findById(req.params.courseId).exec();
    return res.render('course/preview', { title: thisCourse.title, ex: thisCourse });
  } catch (err) {
    console.log(thisCourse);
    res.status(500);
  }
};


exports.deleteById = (req, res) => {
  if (!(req.user.role === 'teacher' || req.user.role === 'admin'))
    return res.status(401).json({ code: 401, error: 'Wrong privilege' });

  /*Delete all customers where the address starts with an "O":*/
  var myquery = { courseId: req.params.courseId };
  Class.deleteMany(myquery, function(err, obj) {
    if (err) throw err;
    console.log(" document(s) deleted");
    // db.close();
  });
  

  Course.findByIdAndRemove(req.params.courseId, function (err, doc) {
    if (err);

    return res.redirect('/course');

  });
}

exports.archieved = (req, res) => {
  if (!(req.user.role === 'teacher' || req.user.role === 'admin'))
    return res.status(401).json({ code: 401, error: 'Wrong privilege' });

  Course.findByIdAndUpdate(req.params.courseId, { status: 0 }, function (err, doc) {
    if (err);

    return res.redirect('/course');

  });
}

exports.publish = (req, res) => {
  if (!(req.user.role === 'teacher' || req.user.role === 'admin'))
    return res.status(401).json({ code: 401, error: 'Wrong privilege' });

  Course.findByIdAndUpdate(req.params.courseId, { status: 1 }, function (err, doc) {
    if (err);

    return res.redirect('/course');

  });
}

exports.deleteModuleById = (req, res) => {
  if (!(req.user.role === 'teacher' || req.user.role === 'admin'))
    return res.status(401).json({ code: 401, error: 'Wrong privilege' });

  Module.findByIdAndRemove(req.params.moduleId, function (err, doc) {
    if (err);
    return res.redirect('/course/' + req.params.courseId);
  });
}

exports.deleteExerciseById = (req, res) => {
  if (!(req.user.role === 'teacher' || req.user.role === 'admin'))
    return res.status(401).json({ code: 401, error: 'Wrong privilege' });

  Exercise.findByIdAndRemove(req.params.exerciseId, function (err, doc) {
    if (err);
    return res.redirect('/course/' + req.params.courseId);
  });
}

exports.updateExerciseById = (req, res, next) => {
  if (req.user.role !== 'teacher')
    return res.status(401).json({ code: 401, error: 'Wrong privilege' });

  Exercise.findByIdAndUpdate(req.params.exerciseId, req.body, function (err, doc) {
    console.log(req.body);
    if (err)
      return res.status(500).json({ code: 500, error: err });
    return res.json({ code: req.body });
  });
}

exports.updateModuleById = (req, res, next) => {
  if (!(req.user.role === 'teacher' || req.user.role === 'admin'))
    return res.status(401).json({ code: 401, error: 'Wrong privilege' });

  Module.findByIdAndUpdate(req.params.moduleId, req.body, function (err, doc) {
    console.log(req.body);
    if (err)
      return res.status(500).json({ code: 500, error: err });
    return res.json({ code: req.params.moduleId });
  });
}

exports.updateById = (req, res, next) => {
  if (req.user.role !== 'teacher')
    return res.status(401).json({ code: 401, error: 'Wrong privilege' });

  Course.findByIdAndUpdate(req.params.courseId, req.body, function (err, doc) {
    console.log(req.body);
    if (err)
      return res.status(500).json({ code: 500, error: err });
    return res.json({ code: req.params.courseId });
  });
}
