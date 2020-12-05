const User = require('../models/User');
const Class = require('../models/Class');
const Exercise = require('../models/Exercise');
const Work = require('../models/Work');

/**
 * GET /
 * Home page.
 */
exports.index = async (req, res) => {
  if (req.user.role == 'student')
    return res.redirect('/student');

  var exerciseList = await Exercise.find({}).exec();
  // console.log(exerciseList);
//   function(err, exerciseList) {
    return res.render('exercise/list', {exercises: exerciseList});
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
  
exports.create = (req, res, next) => {
  if (req.user.role == 'student')
    return res.status(404).json({code:404});

  var newExercise = new Exercise(req.body);
  newExercise.save(function (err) {
      if (err)
        return res.status(500).json({code:500, error: err});
      return res.json({code:200});
  });
};

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
      const exerciseData = classData.exercises.filter((e) => e.active).map((e)=> {e.exId.deadline = e.deadline; return e.exId; }).sort((l,r) => l.title.localeCompare(r.title));
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

      var thisExercise = await Exercise.find({courseId: req.user._id},{},{ sort: { createdAt: -1 } }).exec();
      // console.log('exerciseGroup', exerciseGroups);

      return res.render('exercise/studentlist', {title: 'Exercises', exerciseGroups, inClass: true, exercise:thisExercise});
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
