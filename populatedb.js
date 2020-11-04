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


// users
const userGenerator = (acc, cv) => {
    if (!acc)
      acc = [];
    return acc.concat(
        Array.apply(null, {length:cv[1]})
        .map((no,idx) => {
            return new User({email: cv[0]+idx+'@test.com', password: 'root', role: cv[0]});
        })
    )
}

// classes
const classGenerator = (acc, cv) => {
    if (!acc)
      acc = [];
    return acc.concat(
        Array.apply(null, {length:cv[1]})
        .map((no,idx) => {
            return new Class({classId: cv[0]+idx});
        })
    )
}

// exercises
const exerciseGenerator = (acc, cv) => {
    if (!acc)
      acc = [];
    return acc.concat(
        Array.apply(null, {length:cv[1]})
        .map((no,idx) => {
            return new Exercise({title: cv[0]+idx, instruction: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'});
        })
    )
}

(async () => {

    var users = Object.entries({teacher:2, assistant:3, student:16}).reduce(userGenerator,[]);
    // console.log(users);
    var savedUsers = await Promise.all(users.map((u)=> {return u.save()}));
    // console.log(savedUsers);
    
    var exercises = Object.entries({'01-':3,'02-':2,'03-':2}).reduce(exerciseGenerator, []);
    var savedExercises = await Promise.all(exercises.map((u)=> {return u.save()}));

    var classes = Object.entries({'fit2-m':1,'fit2-w':1}).reduce(classGenerator, []);
    var savedClasses = await Promise.all(classes.map((u)=> {return u.save()}));

    var staffIds = savedUsers.filter((u)=>u.role != 'student').map((u)=>u._id);
    var studentIds = savedUsers.filter((u)=>u.role === 'student').map((u)=>u._id);

    var exerciseIds = savedExercises.map((e)=>{ return {exId:e._id, active: false, deadline: new Date()}; });

    var classData1 = {
        staff: staffIds,
        exercises: exerciseIds,
        students: studentIds.filter((e,idx)=>idx < studentIds.length/2)
    }

    var classData2 = {
        staff: staffIds,
        exercises: exerciseIds,
        students: studentIds.filter((e,idx)=>idx >= studentIds.length/2)
    }

    var classDataUpdated = await Promise.all([
        Class.findByIdAndUpdate(classes[0]._id, {$set: classData1}).exec(),
        Class.findByIdAndUpdate(classes[1]._id, {$set: classData2}).exec()
    ]);
    console.log(classDataUpdated);

    var workByStudents = [];
    classData1.id = classDataUpdated[0]._id;
    classData2.id = classDataUpdated[1]._id;
    [classData1, classData2].forEach((cl) => {
        cl.students.forEach((student) => {
            cl.exercises.forEach((exercise) => {
                if (Math.random() < 0.7)
                    workByStudents.push( new Work({class:cl.id, student, exercise: exercise.exId, savecount:0}));
            })
        })
    });
    var savedWorkByStudents = await Promise.all(
        workByStudents.map((wbs) => {console.log(wbs); return wbs.save()})
    );
    console.log(savedWorkByStudents);

    console.log('done');
    
})();