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
            return new User({email: cv[0]+idx+'@test.com', password: 'root-'+cv[0], role: cv[0]});
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

    var users = Object.entries({teacher:2, assistant:6, student:6}).reduce(userGenerator,[]);
    // console.log(users);
    var savedUsers = await Promise.all(users.map((u)=> {return u.save()}));
    // console.log(savedUsers);
    
    var classes = Object.entries({'FIT1-mon-':1,'FIT1-wed-':1}).reduce(classGenerator, []);
    var savedClasses = await Promise.all(classes.map((u)=> {return u.save()}));

    var staffIds = savedUsers.filter((u)=>u.role != 'student').map((u)=>u._id);
    var studentIds = savedUsers.filter((u)=>u.role === 'student').map((u)=>u._id);


    var classData1 = {
        staff: staffIds,
        exercises: [],
        students: studentIds.filter((e,idx)=>idx < studentIds.length/2)
    }

    var classData2 = {
        staff: staffIds,
        exercises: [],
        students: studentIds.filter((e,idx)=>idx >= studentIds.length/2)
    }

    var classDataUpdated = await Promise.all([
        Class.findByIdAndUpdate(classes[0]._id, {$set: classData1}).exec(),
        Class.findByIdAndUpdate(classes[1]._id, {$set: classData2}).exec()
    ]);
    console.log(classDataUpdated);

    console.log('done');
    
})();