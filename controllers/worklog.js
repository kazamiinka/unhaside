const User = require('../models/User');
const Class = require('../models/Class');
const Exercise = require('../models/Exercise');
const Work = require('../models/Work');
const Worklog = require('../models/Worklog');
const Runlog = require('../models/Runlog');
const io = require('./socketio');
/**
 * GET /worklog
 * get all works
 */
exports.index = async (req, res) => {
  var logList = await Worklog.find({}).exec();
  return res.json(logList);
};

exports.list = async (req, res) => {
    var logList = await Worklog.find({updatedAt:{$gt:req.params.hour*3600000}}).exec();
    return res.json(logList);
};
  

exports.save = (clientIp, work, data, next) => {
    var logBody = Object.assign({work, clientIp}, data);
    delete logBody.id
    var newWorklog = new Worklog(logBody);
    newWorklog.save(function(err, doc) { 
        if (err)
            console.log(err);
        else {
            io.get().to('stats').emit('worklog', doc);
            // console.log('send io.worklog save');
        }

        if (next) next(err, doc);
    });
}

exports.create = (req, res) => {
    var newWorklog = new Worklog(Object.assign({student: String(req.user._id), clientIp: req.ip}, req.body));
    newWorklog.save(function (err, doc) {
        if (err)
            return res.status(500).json({code:500, error: err});
        else {
            io.get().to('stats').emit('worklog', doc);
            // console.log('send io.worklog create');
        }
        return res.json({code:200});
    });
};
