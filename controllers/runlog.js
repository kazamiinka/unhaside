const User = require('../models/User');
const Class = require('../models/Class');
const Exercise = require('../models/Exercise');
const Work = require('../models/Work');
const Runlog = require('../models/Runlog');
const io = require('./socketio');

/**
 * GET /runlog
 * get all works
 */
exports.index = async (req, res) => {
  var logList = await Runlog.find({}).exec();
  console.log(logList);
  return res.json(logList);
};

exports.save = (clientIp, student, data, next) => {
    var newRunlog = new Runlog(Object.assign({student: String(req.user._id), clientIp: req.ip}, req.body));
    newRunlog.save(function (err, doc) {
        if (err)
            return res.status(500).json({code:500, error: err});
        else {
            io.get().to('stats').emit('runlog', doc);
            // console.log('send io.runlog save');
        }

        if (next) next(err, doc);
    });
}

exports.create = (req, res) => {
    var newRunlog = new Runlog(Object.assign({student: String(req.user._id), clientIp: req.ip}, req.body));
    newRunlog.save(function (err, doc) {
        if (err)
            return res.status(500).json({code:500, error: err});
            else {
                io.get().to('stats').emit('runlog', doc);
                // console.log('send io.runlog create');
            }
            return res.json({code:200});
    });
};
