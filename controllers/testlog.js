const Testlog = require('../models/Testlog');
const io = require('./socketio');

/**
 * GET /testlog
 * get all works
 */
exports.index = async (req, res) => {
  var logList = await Testlog.find({}).exec();
  console.log(logList);
  return res.json(logList);
};

exports.save = (clientIp, student, data, next) => {
    var newTestlog = new Testlog(Object.assign({student: String(req.user._id), clientIp: req.ip}, req.body));
    newTestlog.save(function (err, doc) {
        if (err)
            return res.status(500).json({code:500, error: err});
        else {
            io.get().to('stats').emit('testlog', doc);
            // console.log('send io.runlog save');
        }

        if (next) next(err, doc);
    });
}

exports.create = (req, res) => {
    var newTestlog = new Testlog(Object.assign({student: String(req.user._id), clientIp: req.ip}, req.body));
    newTestlog.save(function (err, doc) {
        if (err)
            return res.status(500).json({code:500, error: err});
            else {
                io.get().to('stats').emit('testlog', doc);
                // console.log('send io.runlog create');
            }
            return res.json({code:200});
    });
};
