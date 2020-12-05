const Staffworklog = require('../models/Staffworklog');
const io = require('./socketio');

/**
 * GET /testlog
 * get all works
 */
exports.index = async (req, res) => {
  var logList = await Staffworklog.find({}).exec();
  console.log(logList);
  return res.json(logList);
};

exports.save = (clientIp, student, data, next) => {
    var newStaffworklog = new Staffworklog(Object.assign({student: String(req.user._id), clientIp: req.ip}, req.body));
    newStaffworklog.save(function (err, doc) {
        if (err)
            return res.status(500).json({code:500, error: err});
        else {
            // io.get().to('staff').emit('testlog', doc);
            // console.log('send io.runlog save');
        }

        if (next) next(err, doc);
    });
}

exports.create = (req, res) => {
    var newStaffworklog = new Staffworklog(req.body);
    newStaffworklog.save(function (err, doc) {
        if (err)
            return res.status(500).json({code:500, error: err});
            else {
                io.get().to('staff').emit('staffworklog', doc);
                // console.log('send io.runlog create');
            }
            return res.json({code:200});
    });
};
