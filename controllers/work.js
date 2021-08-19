const User = require('../models/User');
const Class = require('../models/Class');
const Exercise = require('../models/Exercise');
const Work = require('../models/Work');
const Worklog = require('../models/Worklog');
const md5 = require('blueimp-md5')

const worklog = require('./worklog');

/**
 * GET /work
 * get all works
 */
exports.index = async (req, res) => {
  var workList = await Work.find({}).exec();
//   function(err, workList) {
    return res.render('work/list', {title: 'Works', works: workList});
//   });
//   MyModel.find({ name: /john/i }, 'name friends', function (err, docs) { })
};

/**
 * GET /work/class/:classId
 * get all works in a class 
 */
exports.indexByClass = async (req, res) => {
  const [workData, classData] = await Promise.all([
      Work.find({class:req.params.classId})
        .sort({student:1,exercise:1})
        .exec(),
      Class.findById(req.params.classId)
        .populate('students')
        .populate('exercise')
        .exec()
  ]);
  const exerciseData = classData.exercises;
  const studentData = classData.students;

  res.json({workData, classData});
};

/**
 * GET /work/student/:studentId
 * get all works in a class
 */
exports.indexByStudent = async (req, res) => {
    const [workData, classData] = await Promise.all([
        Work.find({student:req.params.studentId})
          .sort({exercise:1})
          .exec(),
        Class.findOne({students:{$all: [req.params.studentId]}})
          .populate('exercise.exId')
          .exec()
    ]);
    const exerciseData = classData.exercises;
  
  res.json({workData, classData});
};


/**
 * GET /work/:workId
 * get one work
 */
exports.getById = async (req, res) => {
  if (req.params.workId === 'new') {
    return res.render('work/new', {
    });
  }
  try {
      var thisWork = await Work.findById(req.params.workId).exec();
      return res.render('work/edit', {title: 'Editor', ex: thisWork});
  } catch(err) {
      console.log(err);
      res.status(500);
  }
};

/**
 * GET /work/exercise/:workId
 * get one work
 */

exports.getByExercise = async (req, res) => {
    try {

        var exerciseStudent = req.params.studentId
        var isDosenPage = exerciseStudent ? true : false
        var studentId = exerciseStudent ? exerciseStudent : req.user._id
        var [exerciseData, workData, classData] = await Promise.all([
            Exercise.findById(req.params.exerciseId).exec(),
            Work.findOne({exercise:req.params.exerciseId, student:studentId}).sort({updatedAt:-1}).exec(),
            Class.findOne({students:{$all: [req.user._id]}}).exec(),
        ]);

        const http = require('http'); // or 'https' for https:// URLs
        const fs = require('fs');
        var fileNameHtml = 'exercise.html';
        var fileNameCss = 'exercise.css';
        var fileNameJs = 'exercisejs.txt';
        fs.writeFile('outputFiles/exercise/'+fileNameHtml, workData.html, function (err) {
            if (err) console.log(err)
        })
        fs.writeFile('outputFiles/exercise/'+fileNameCss, workData.css, function (err) {
            if (err) console.log(err)
        })
        const fileJs = `${__dirname}/outputFiles/exercise/exercisejs.txt`;
        fs.writeFile('outputFiles/exercise/'+fileNameJs, workData.js, function (err) {
            if (err) console.log(err)
        })

        if (!workData) {
            workData = {
                html: exerciseData.html,
                css: exerciseData.css,
                js: exerciseData.js,
                savecount: 0,
                student: req.user._id,
            }
        }
        if(exerciseData.enablerunraw){
            if (!workData.html.trim())
            workData.html = exerciseData.html.trim();
            if (!workData.css.trim())
                workData.css = exerciseData.css.trim();
            if (!workData.js.trim())
                workData.js = exerciseData.js;
           
        }

        var themeList = [
            {monokai:"Monokai"},
            {merbivore:"Merbivore"},
            {ambiance:"Ambiance"},
            {chaos:"Chaos"},
            {chrome:"Chrome"},
            {clouds:"Clouds"},
            {clouds_midnight:"Clouds Midnight"},
            {cobalt:"Cobalt"},
            {crimson_editor:"Crimson Editor"},
            {daw:"Dawn"},
            {dracula:"Dracula"},
            {dreamweaver:"Dreamweaver"},
            {eclipse:"Eclipse"},
            {github:"Github"},
            {gob:"Gob"},
            {gruvbox:"Gruvbox"},
            {idle_finger:"Idle Finger"},
            {iplastic:"Iplastic"},
            {katzenmilch:"Katzenmilch"},
            {kr_theme:"KR Theme"},
            {kuroir:"Kuroir"},
            {merbivore_soft:"Merbivore Soft"},
            {mono_industrial:"Mono Industrial"},
            {ambnord_dark:"Nord Dark"},
            {one_dark:"One Dark"},
            {pastel_on_dark:"Pastel On Dark"},
            {xcode:"X Code"},
        ];
        
        res.render('work/edit',{title: 'Editor: '+exerciseData.title, exercise:exerciseData, work:workData, isDosenPage:isDosenPage, themeList:themeList});
        // res.json({exercise:exerciseData, work:workData, classdata:null});
    } catch(err) {
        console.log(err);
        res.status(500);
    }
};

/**                                                                                                                 
 * GET /work/student-exercise/:studentId/:exerciseId                                                                
 * get one work                                                                                                     
 */                                                                                                                 
                                                                                                                    
exports.getByStudentExercise = async (req, res) => {                                                                
    try {                                                                                                           
        var [exerciseData, workData] = await Promise.all([                                                          
            Exercise.findById(req.params.exerciseId).exec(),                                                        
            Work.findOne({exercise:req.params.exerciseId, student:req.params.studentId}).populate('exercise').populate('student').sort({updatedAt:-1}).exec()                                                                           
        ]);                                                                                                         
        if (!workData) {                                                                                            
            workData = {                                                                                            
                html: exerciseData.html,                                                                            
                css: exerciseData.css,                                                                              
                js: exerciseData.js,                                                                                
                savecount: 0,                                                                                       
                student: req.user._id,                                                                              
            }                                                                                                       
        }                                                                                                           
        res.render('work/show-studentwork',{title: 'Student Work: '+exerciseData.title, exercise:exerciseData, work: workData});                                                                                                         
        // res.json({exercise:exerciseData, work:workData, classdata:null});                                        
    } catch(err) {                                                                                                  
        console.log(err);                                                                                           
        res.status(500);                                                                                            
    }                                                                                                               
};                                                                                                                  
                                                                                                                    
exports.create = (req, res, next) => {
    const classData = Class.findOne({students:{$all: [req.user._id]}}).exec();
    var newWork = new Work(Object.assign({class:classData._id},req.body));
    newWork.save(function (err, doc) {
        if (err)
            return res.status(500).json({code:500, error: err});
        worklog.save(req.ip, doc._id, req.body);
        // var logBody = Object.assign({work:doc._id, clientIp: req.ip}, req.body);
        // delete logBody.id
        // var newWorklog = new Worklog(logBody);
        // newWorklog.save(function(err) { if (err) console.log(err);});

        return res.json({code:200, workId: doc._id});
    });
};

exports.updateById = (req, res, next) => {
    // console.log(req.session, req.user, req.body.student, req.body.student == req.user._id);
    // console.log(md5(req.body.html+req.body.css+req.body.js),req.body.hash);
    // console.log(req.body);
    if (req.user && req.body.student == String(req.user._id)) {
        Work.findByIdAndUpdate(req.params.workId, {$set:req.body}, function(err, doc) {
            // console.log(err, doc);
            worklog.save(req.ip, req.params.workId, req.body);
            // var logBody = Object.assign({work:req.params.workId, clientIp: req.ip}, req.body);
            // delete logBody.id
            // var newWorklog = new Worklog(logBody);
            // newWorklog.save(function(err) { if (err) console.log(err);});
            if (err)
                return res.status(500).json({code:500, error: err});
            return res.json({code:200});
        });
    }
    else
        return res.status(401).json({code:401});
};

exports.addWorkLog = (req, res) => {
    if (req.user && req.body.student == String(req.user._id)) {
        worklog.save(req.ip, null, req.body, function(err, doc) {
            if (err)
                return res.status(500).json({code:500, error: err});
            return res.json({code:200});
        });
        // var newWorklog = new Worklog(Object.assign({clientIp: req.ip},req.body));
        //     newWorklog.save(function(err) {
        //         if (err)
        //         return res.status(500).json({code:500, error: err});
    }
    else
        return res.status(401).json({code:401});
};
