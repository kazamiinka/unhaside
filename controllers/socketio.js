const redis = require('redis');
const Staffworklog = require('../models/Staffworklog');

const redisClient = redis.createClient();

const {promisify} = require('util');
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);

var socketIO;

exports.set = (io) => { socketIO = io; return io; }

exports.get = () => socketIO;

exports.start = () => {
    if (!socketIO)
        return;

    socketIO.on('connection', (socket) => {
        // console.log('connected', socket.handshake);
        socket.emit('hello', Date.now());

        socket.on('get-time', () => socket.emit('time', Date.now()));

        socket.on('join', async (message) => {
            if (message == 'stats') {
                socket.join('stats');
                socket.on('stats', async (message) => {
                    console.log('stats', message.classId, message.userId);
                    var newlog = new Staffworklog(message);
                    var newRank = {classId: message.classId, userId: message.userId, ranks: getRanks(message.stats)};
                    socketIO.to('staff'+message.classId).emit('rank', newRank);
                    try {
                        await Promise.all([
                            setAsync('stats'+message.classId, JSON.stringify(newRank)),
                            newlog.save()
                        ]);
                    }
                    catch(e) {
                        console.log(e);
                    }
                });
            }

            if (message.type == 'staff') {
                console.log('join-staff');
                socket.join('staff'+message.classId);

                socket.on('get-rank', async (classId) => {
                    var rankData = await getAsync('stats'+classId);
                    if (rankData)
                        socket.emit('rank', JSON.parse(rankData))
                });

                socket.on('action', async (message) => {
                    // socketIO.to('staff'+message.classId).emit('action', message);

                    var newLog = new Staffworklog(message);
                    await newLog.save();
                });

                socket.on('disconnect', ()=> {
                    console.log('staff disconnected');
                })
            }

        })
    });
}

exports.redisGet = getAsync
exports.redisSet = setAsync


function getRanks(statsData) {
    var rankData =
    statsData.map((student) => {
        var deskData = {key: student.key, id: student.id};

        var latestUpdate;
        if(student.latestWork)
            latestUpdate = student.latestWork
        if (!latestUpdate) {
            latestUpdate = student.latestRun;
        }
        else {
            if (student.latestRun && latestUpdate.find((d) => d.key == 'update-time').title < student.latestRun.find((d) => d.key == 'update-time').title )
                latestUpdate = student.latestRun;
        }
        if (!latestUpdate) {
            latestUpdate = student.latestWork;
        }
        else {
            if (student.latestTest && latestUpdate.find((d) => d.key == 'update-time').title < student.latestTest.find((d) => d.key == 'update-time').title )
                latestUpdate = student.latestTest;
        }
        deskData.latestUpdate = latestUpdate;

        var rankTest = [1000, ''];
        var rankRun = [1000, ''];
        var rankWork = [1000, ''];
        var testExercise = '';
        for (var exIdx = student.value.length-1; exIdx >=0; --exIdx) {
            if (student.latestWork && !rankWork[1]) {
                if (student.latestWork[0].value == student.value[exIdx].key && student.value[exIdx].firstSavedAt)
                    rankWork = [student.value[exIdx].rankFirstSavedAt, student.value[exIdx].key]
            }
            if (student.latestRun && !rankRun[1]) {
                if (student.latestRun[0].value == student.value[exIdx].key && student.value[exIdx].firstRunAt)
                    rankRun = [student.value[exIdx].rankFirstRunAt, student.value[exIdx].key]
            }
            if (student.latestTest && !rankTest[1]) {
                if (student.latestTest[0].value == student.value[exIdx].key && student.value[exIdx].firstPassAt)
                    rankTest = [student.value[exIdx].rankFirstPassAt, student.value[exIdx].key]
            }

            // if (!rankTest[1] && student.value[exIdx].firstPassAt && student.value[exIdx].rankFirstPassAt) {
            //     rankTest = [student.value[exIdx].rankFirstPassAt, student.value[exIdx].key];
            // }
            // if (!rankRun[1] && student.value[exIdx].firstRunAt && student.value[exIdx].rankFirstRunAt) {
            //     rankRun = [student.value[exIdx].rankFirstRunAt, student.value[exIdx].key];
            // }
            // if (!rankWork[1] && student.value[exIdx].firstSavedAt && student.value[exIdx].rankFirstSavedAt) {
            //     rankWork = [student.value[exIdx].rankFirstSavedAt, student.value[exIdx].key];
            // }
        }
        deskData.rankTest = rankTest;
        deskData.rankRun = rankRun;
        deskData.rankWork = rankWork;

        return deskData;
    });

    return rankData;
}