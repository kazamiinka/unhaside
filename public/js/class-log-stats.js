const classId = location.pathname.split('/').pop();
let startLogTime = 0 // Date.now() - 1*3600*1000; // 3 hours ago

// https://momentjs.com/docs/#/customization/relative-time/
moment.updateLocale('en', {
    relativeTime : {
        s : 'just now',
        ss : '%d secs',
        m : '1 min',
        mm : '%d mins',
        h : '1 hour',
        d : '1 day',
        M : '1 month',
        y : '1 year'
    }
});

let worklogs = {
    data: {},
    stats: {},
    latestWork: {},
    initialized: false,
    updated: false,
    init: function(wl) {
        this.data = {};
        this.stats = {};
        this.latestWork = {};
        wl.forEach((w) => this.add(w));
        this.initialized = true;
        this.updated = true;
        return this.data;
    },
    add: function(w) {
        if (!this.data[w.student]) {
            this.data[w.student] = {};
            this.stats[w.student] = {};
        }

        this.latestWork[w.student] = w;

        if (!this.data[w.student][w.exercise]) {
            this.data[w.student][w.exercise] = [w];
            this.stats[w.student][w.exercise] = {
                savecount: 0, // number of saves
                pastecount: 0, // number of pastes
                pasteChars: 0, // total characters of pastes
                clientIp: 0, //w.clientIp, // last ip address
                updatedAt: 0, //w.updatedAt, // last save time
                firstSavedAt: 0,
            };
        }
        // else {
        //     this.data[w.student][w.exercise].push(w);
        //     if (this.data[w.student][w.exercise].length > 5)
        //         this.data[w.student][w.exercise].shift();
        // }

        this.stats[w.student][w.exercise].savecount = w.savecount >= 0 ? w.savecount : this.stats[w.student][w.exercise].savecount; // number of saves
        this.stats[w.student][w.exercise].clientIp = w.clientIp;
        if (w.savecount == -1) {
            var pastes = w.logs.filter((l) => l.type == 'paste')
            var pasteLength = pastes.reduce((acc,cur) => acc + cur.text.length, 0)
            this.stats[w.student][w.exercise].pastecount += pastes.length; // number of pastes
            this.stats[w.student][w.exercise].pasteChars += pasteLength; // total characters of pastes
        }
        else {
            this.stats[w.student][w.exercise].updatedAt = w.updatedAt;
            if (this.stats[w.student][w.exercise].firstSavedAt == 0)
                this.stats[w.student][w.exercise].firstSavedAt = w.updatedAt;
        }
        // console.log('stats', this.stats[w.student][w.exercise], w);
        this.updated = true;
        return w;
    },
    prepareStats: function() {
        var self = this;
        var prepStats = Object.keys(self.stats).map((curStudent) => {
            var username = classData.students.find((s) => s._id == curStudent).email.replace(/@.+/, '');
            var exercise = Object.keys(self.stats[curStudent]).map((curExercise) => {
                try {
                    var exTitle = classData.exercises.find((e) => e.exId._id == curExercise).exId.title;                    
                    var workStats = Object.assign({key: exTitle, exercise: curExercise, student: curStudent}, self.stats[curStudent][curExercise]);
                    var updateTime = workStats.updatedAt ? moment(workStats.updatedAt).fromNow(true) : '';
                    workStats.worklogs = [
                        {   key: 'savecount right-align',
                            value:  workStats.savecount,
                        },
                        {   key: 'paste right-align' + (workStats.pastecount ? ' red-error' : ''),
                            value:  workStats.pastecount,
                        },
                        {   key: 'paste paste-char right-align' +  (workStats.pasteChars ? ' red-error' : ''),
                            value:  workStats.pasteChars,
                        },
                        {   key: 'client-addr',
                            value:  workStats.clientIp,
                        },
                        {   key: 'update-time',
                            title: workStats.updatedAt,
                            value:  updateTime,
                        },
                    ];
                    return workStats;
                }
                catch(e) {
                    return {key: null};
                }
            }).filter((e)=>e.key).sort((l,r)=>l.key.localeCompare(r.key));

            // get the exercise with the latest work
            var latestWork = [];
            try {
                latestWork = exercise.find((s) => s.exercise == self.latestWork[curStudent].exercise);
                latestWork = [{key: 'exercise', value: latestWork.key}].concat(latestWork.worklogs)
            }
            catch(e) {}

            return {
                key: username,
                id: curStudent,
                latestWork,
                value: exercise
            };
        }).sort((l,r)=>l.key.localeCompare(r.key));

        return prepStats;
    }
};

/*
 split runlogs by studentid
 for each runlogs[studentid][workid], group by run and concatenate the logs
*/
let runlogs = {
    data: {},
    stats: {},
    latestRun: {},
    initialized: false,
    updated: false,
    init: function(rl) {
        this.data = {};
        this.stats = {};
        this.latestWork = {};
        rl.forEach((r) => this.add(r));
        this.initialized = true;
        this.updated = true;
        return this.data;
    },
    add: function(r) {
        // r : {... logs: [...] }
        if (!this.data[r.student]) {
            this.data[r.student] = {};
            this.stats[r.student] = {};
        }

        this.latestRun[r.student] = r;

        let errors = r.logs.filter((l) => l[1].search('Error') >= 0).length;
        let functionCalls = r.logs.filter((l) => l[1] === 'element' && l[3] === 'start').length;

        if (!this.data[r.student][r.exercise]) {
            this.data[r.student][r.exercise] = [r];

            this.stats[r.student][r.exercise] = {
                runs: 1, // number of runs
                errors: errors, // number of errors on the last run
                functionCalls: functionCalls, // number of function calls on the last run
                clientIp: r.clientIp, // last ip address
                updatedAt: r.updatedAt, // last run update time
                firstRunAt: r.updatedAt, // first run time
            }
        }
        else {
            this.stats[r.student][r.exercise].clientIp = r.clientIp;
            this.stats[r.student][r.exercise].updatedAt = r.updatedAt;

            var studentLog = this.data[r.student][r.exercise];
            if (studentLog[studentLog.length-1].run == r.run) {
                // studentLog[studentLog.length-1].logs = studentLog[studentLog.length-1].logs.concat(r.logs);

                this.stats[r.student][r.exercise].errors += errors;
                this.stats[r.student][r.exercise].functionCalls += functionCalls;
            }
            else {
                studentLog.push(r);
                if (studentLog.length > 1)
                    studentLog.shift();
                // new run; add run counts, 
                this.stats[r.student][r.exercise].runs++;
                this.stats[r.student][r.exercise].errors = errors;
                this.stats[r.student][r.exercise].functionCalls = functionCalls;
            }
        }
        // console.log('stats', this.stats[r.student][r.exercise], errors, functionCalls, r.logs)
        this.updated = true;
        return r;
    },
    prepareStats: function() {
        var self = this;
        var prepStats = Object.keys(self.stats).map((curStudent) => {
            var username = classData.students.find((s) => s._id == curStudent).email.replace(/@.+/, '');

            var exercise = Object.keys(self.stats[curStudent]).map((curExercise) => {
                try {
                    var exTitle = classData.exercises.find((e) => e.exId._id == curExercise).exId.title;
                    var runStats = Object.assign({key: exTitle, exercise: curExercise, student: curStudent}, self.stats[curStudent][curExercise]);
                    var updateTime = runStats.updatedAt ? moment(runStats.updatedAt).fromNow(true) : '';
                    runStats.runlogs = [
                        {   key: 'runs right-align',
                            value:  runStats.runs,
                        },
                        {   key: 'errors right-align' + (runStats.errors ? ' red-error' : ''),
                            value:  runStats.errors,
                        },
                        {   key: 'functionCalls right-align',
                            value:  runStats.functionCalls,
                        },
                        {   key: 'client-addr',
                            value:  runStats.clientIp,
                        },
                        {   key: 'update-time',
                            title: runStats.updatedAt,
                            value:  updateTime,
                        },
                    ]

                    return runStats;
                }
                catch(e) {
                    return {key:null};
                }
            }).filter((e)=>e.key).sort((l,r)=>l.key.localeCompare(r.key));

            // get exercise with the latest runlog
            var latestRun = [];
            try {
                latestRun = exercise.find((s) => s.exercise == self.latestRun[curStudent].exercise);
                latestRun = [{key: 'exercise', value: latestRun.key}].concat(latestRun.runlogs)
            }
            catch(e) {}
            return { 
                key: username,
                id: curStudent,
                latestRun,
                value: exercise
            };
        }).sort((l,r)=>l.key.localeCompare(r.key));

        return prepStats;

    }
};

/*
 split testlogs by studentid
 for each testlogs[studentid][workid], group by test and concatenate the logs
*/
let testlogs = {
    data: {},
    stats: {},
    latestTest: {},
    initialized: false,
    updated: false,
    init: function(tl) {
        this.data = {};
        this.stats = {};
        this.latestWork = {};
        tl.forEach((r) => this.add(r));
        this.initialized = true;
        this.updated = true;
        return this.data;
    },
    add: function(t) {
        // t : {... logs: [...] }
        if (!this.data[t.student]) {
            this.data[t.student] = {};
            this.stats[t.student] = {};
        }

        this.latestTest[t.student] = t;

        let testResults = t.logs[2]
        let errors = Object.keys(testResults).filter((l) => testResults[l] == false);

        if (!this.data[t.student][t.exercise]) {
            this.data[t.student][t.exercise] = [t];

            this.stats[t.student][t.exercise] = {
                tests: 1, // number of tests
                errors: errors, // errors on the last test
                clientIp: t.clientIp, // last ip address
                updatedAt: t.updatedAt, // last test update time
                firstPassAt: errors.length ? 0 : t.updatedAt, // test passes the first time
            }
        }
        else {
            this.stats[t.student][t.exercise].clientIp = t.clientIp;
            this.stats[t.student][t.exercise].updatedAt = t.updatedAt;
            this.stats[t.student][t.exercise].tests++;
            this.stats[t.student][t.exercise].errors = errors;
            this.stats[t.student][t.exercise].firstPassAt = errors.length ? 0 : t.updatedAt;
        }
        // console.log('stats', this.stats[t.student][t.exercise], errors, functionCalls, t.logs)
        this.updated = true;
        return t;
    },
    prepareStats: function() {
        var self = this;
        var prepStats = Object.keys(self.stats).map((curStudent) => {
            var username = classData.students.find((s) => s._id == curStudent).email.replace(/@.+/, '');

            var exercise = Object.keys(self.stats[curStudent]).map((curExercise) => {
                try {
                    var exTitle = classData.exercises.find((e) => e.exId._id == curExercise).exId.title;                    
                    var testStats = Object.assign({key: exTitle, exercise: curExercise, student: curStudent}, self.stats[curStudent][curExercise]);
                    var updateTime = testStats.updatedAt ? moment(testStats.updatedAt).fromNow(true) : '';

                    testStats.testlogs = [
                        {   key: 'tests right-align',
                            value:  testStats.tests,
                        },
                        {   key: 'errors right-align' + (testStats.errors.length ? ' red-error' : ''),
                            value:  testStats.errors.length,
                            title: testStats.errors.join('; '),
                        },
                        {   key: 'client-addr',
                            value:  testStats.clientIp,
                        },
                        {   key: 'update-time',
                            title: testStats.updatedAt,
                            value:  updateTime,
                        },
                    ]

                    return testStats;
                }
                catch(e) {
                    return {key:null};
                }
            }).filter((e)=>e.key).sort((l,r)=>l.key.localeCompare(r.key));

            // get exercise with the latest testlog
            var latestTest = [];
            try {
                latestTest = exercise.find((s) => s.exercise == self.latestTest[curStudent].exercise);
                latestTest = [{key: 'exercise', value: latestTest.key}].concat(latestTest.testlogs)
            }
            catch(e) {}
            return { 
                key: username,
                id: curStudent,
                latestTest,
                value: exercise
            };
        }).sort((l,r)=>l.key.localeCompare(r.key));

        return prepStats;

    }
};

// merge the two stats for D3
let mergeStats = () => {
    var ws = worklogs.prepareStats();
    var rs = runlogs.prepareStats();
    var ts = testlogs.prepareStats();

    rs.forEach((r) => {
        const alsoInWorklogs = ws.find((w) => w.key == r.key);
        if (!alsoInWorklogs) {
            // in Run but not in Work
            ws.push(r);
            ws.sort((l,r)=>l.key.localeCompare(r.key));
        }
        else {
            r.value.forEach((re) => {
                const alsoInWorkEx = alsoInWorklogs.value.find((e) => e.key == re.key);
                if (!alsoInWorkEx) {
                    alsoInWorklogs.value.push(re);
                    alsoInWorklogs.value.sort((l,r)=>l.key.localeCompare(r.key));
                }
                else {
                    alsoInWorkEx.runlogs = re.runlogs;
                    alsoInWorkEx.firstRunAt = re.firstRunAt;
                }
            });
            alsoInWorklogs.latestRun = r.latestRun;
        }
    });

    ts.forEach((r) => {
        const alsoInWorklogs = ws.find((w) => w.key == r.key);
        if (!alsoInWorklogs) {
            // in Test but not in Work
            ws.push(r);
            ws.sort((l,r)=>l.key.localeCompare(r.key));
        }
        else {
            r.value.forEach((re) => {
                const alsoInWorkEx = alsoInWorklogs.value.find((e) => e.key == re.key);
                if (!alsoInWorkEx) {
                    alsoInWorklogs.value.push(re);
                    alsoInWorklogs.value.sort((l,r)=>l.key.localeCompare(r.key));
                }
                else {
                    alsoInWorkEx.testlogs = re.testlogs;
                    alsoInWorkEx.firstPassAt = re.firstPassAt
                    if (alsoInWorkEx.firstPassAt && alsoInWorkEx.firstSavedAt)
                        alsoInWorkEx.timeToComplete = new Date(alsoInWorkEx.firstPassAt) - new Date(alsoInWorkEx.firstSavedAt)
                }
            });
            alsoInWorklogs.latestTest = r.latestTest;
        }
    });

    rankUserByStats(ws);
    return ws;
};

function rankUserByStats(allStats) {
    var exercises = {};
    allStats.forEach(function(student, studentIdx) {
        student.value.forEach(function(exercise, exerciseIdx) {
            if (!exercises[exercise.key]) {
                exercises[exercise.key] = {
                    firstSavedAt: [],
                    firstRunAt: [],
                    firstPassAt: [],
                    timeToComplete: []
                }
            }
            exercises[exercise.key].key = exercise.key;
            exercises[exercise.key].firstSavedAt.push({key: student.key, idx: studentIdx, value: (new Date(exercise.firstSavedAt || 0)).valueOf() })
            exercises[exercise.key].firstRunAt.push({key: student.key, idx: studentIdx, value: (new Date(exercise.firstRunAt || 0)).valueOf() })
            exercises[exercise.key].firstPassAt.push({key: student.key, idx: studentIdx, value: (new Date(exercise.firstPassAt || 0)).valueOf() })
            exercises[exercise.key].timeToComplete.push({key: student.key, idx: studentIdx, value: exercise.timeToComplete || 0 })
        })
    });

    const rankClass = (r) => r >= 30 ? 30 : ( r >= 20 ? 20 : ( r >= 10 ? 10 : r ));
    
    for (key in exercises) {
        exercises[key].firstSavedAt.filter((e) => e.value !== 0).sort((l, r) => l.value < r.value)
            .forEach(function(e, rank) {
                ++rank;
                var thisEx = allStats[e.idx].value.find((ex) => ex.key == key);
                thisEx.rankFirstSavedAt = rank;
                thisEx.worklogs.unshift({key: 'right-align rank rank-'+rankClass(rank), value: rank, title: e.value});
            })
        exercises[key].firstRunAt.filter((e) => e.value !== 0).sort((l, r) => l.value < r.value)
            .forEach(function(e, rank) {
                ++rank;
                var thisEx = allStats[e.idx].value.find((ex) => ex.key == key);
                thisEx.rankFirstRunAt = rank;
                thisEx.runlogs.unshift({key: 'right-align rank rank-'+rankClass(rank), value: rank, title: e.value});
            })
        exercises[key].timeToComplete.filter((e) => e.value !== 0).sort((l, r) => l.value < r.value)
            .forEach(function(e, rank) {
                ++rank;
                var thisEx = allStats[e.idx].value.find((ex) => ex.key == key);
                thisEx.timeToComplete = rank;
                thisEx.testlogs.unshift({key: 'right-align time-rank rank-'+rankClass(rank), value: rank, title: e.value});
            })
        exercises[key].firstPassAt.filter((e) => e.value !== 0).sort((l, r) => l.value < r.value)
            .forEach(function(e, rank) {
                ++rank;
                var thisEx = allStats[e.idx].value.find((ex) => ex.key == key);
                thisEx.rankFirstPassAt = rank;
                thisEx.testlogs.unshift({key: 'right-align rank rank-'+rankClass(rank), value: rank, title: e.value});
            })
    }
}

let classData;

async function initializeLogStats() {
    let response = await fetch('/classlog-stats/'+classId+'/'+(new Date(startLogTime)).valueOf());
    let logData = await response.json();
    classData = logData.classData;

    worklogs.init([]);
    worklogs.stats = logData.worklogs.stats;
    worklogs.latestWork = logData.worklogs.latestWork;
    runlogs.init([]);
    runlogs.stats = logData.runlogs.stats;
    runlogs.latestRun = logData.runlogs.latestRun;
    testlogs.init([]);
    testlogs.stats = logData.testlogs.stats;
    testlogs.latestTest = logData.testlogs.latestTest;

    updateMergelogs();
    return logData;
}

let socket = io({transports:['websocket']});

socket.on('worklog', (log) => {
    if (classData && classData.students.find((s) => s._id == log.student))
        worklogs.add(log);
    // updateWorklogs();
    // console.log(log);
    // latestLogTime = log.updatedAt;
});

socket.on('runlog', (log) => {
    if (classData && classData.students.find((s) => s._id == log.student))
        runlogs.add(log);
    // updateRunlogs();
    // console.log(log);
    // latestLogTime = log.updatedAt;
});

socket.on('testlog', (log) => {
    if (classData && classData.students.find((s) => s._id == log.student))
        testlogs.add(log);
    // updateRunlogs();
    // console.log(log);
    // latestLogTime = log.updatedAt;
});

var res;
socket.on('connect', async () => {
    // res = await initializeLogs();
    socket.emit('join', 'stats');
    if (!startLogTime)
        return;
    res = await initializeLogStats();
});

// --- d3js ---

function array_from_object(o) {
    if (Array.isArray(o))
        return o;

    return Object.keys(o).sort().map((k) => {
            val = o[k];
            if (typeof(val) == 'object') {
                console.log('obj', val);
                val = array_from_object(val);
            }
            return {key:k, value:val}
        });
}

// Use data as is.
var ident = function(d) { return d; };


const updateWorklogs = () => {

    wx = worklogs.prepareStats();
    wu = d3.select('#worklogs-display').selectAll('div').data(wx, (d)=>d.key);
    wug = wu.enter().append('div').attr('class','student').merge(wu).text((d)=>d.key);
    wu.exit().remove();

    wv= wug.selectAll('div').data((d)=>d.value, (d)=>d.key);
    wvg = wv.enter().append('div').attr('class', 'work').merge(wv).text((d)=>d.key);
    wv.exit().remove();

    ww = wvg.selectAll('span').data((d)=>d.worklogs);
    wwg = ww.enter().append('span').attr('class',(d)=>d.key).merge(ww).text((d)=>d.value, (d)=>d.key);
    ww.exit().remove();

}

const updateRunlogs = () => {

    rx = runlogs.prepareStats();
    ru = d3.select('#runlogs-display').selectAll('div').data(rx, (d)=>d.key);
    rug = ru.enter().append('div').attr('class','student').merge(ru).text((d)=>d.key);
    ru.exit().remove();
    
    rv= rug.selectAll('div').data((d)=>d.value, (d)=>d.key);
    rvg = rv.enter().append('div').attr('class', 'work').merge(rv).text((d)=>d.key);
    rv.exit().remove();
    
    rw = rvg.selectAll('span').data((d)=>d.runlogs);
    rwg = rw.enter().append('span').attr('class',(d)=>d.key).merge(rw).text((d)=>d.value, (d)=>d.key);
    rw.exit().remove();
    
}

var mx;
var sendStatsTimeout = 0;
const thisUserId = $('.page-header').data('user-id')

var updateMergelogs = () => {
    // if (!runlogs.updated && !worklogs.updated && !testlogs.updated)
    //     return;

    mx = mergeStats();

    // console.log('updateMerge', sendStatsTimeout, worklogs.updated, runlogs.updated, testlogs.updated);
    if (!sendStatsTimeout && (runlogs.updated || worklogs.updated || testlogs.updated)) {
        sendStatsTimeout = setTimeout(function() {
            socket.emit('stats', {classId: classData._id, userId: thisUserId, stats: mx});
            sendStatsTimeout = 0;
        }, 1000);
        runlogs.updated = false;
        worklogs.updated = false;
        testlogs.updated = false;
    }


    su = d3.select('#stat-summary').selectAll('div').data(mx, (d)=>d.key);
    // console.log('su', su._enter[0], su._exit[0]);
    sug = su.enter().append('div').attr('class','student-summary').merge(su);

    
    // sug.append('a').attr('href', (d)=>'#student-'+d.id).text((d)=>d.key)
    sug.append('div').attr('class','student-link');
    sug.append('div').attr('class', 'testlogs-summary');
    sug.append('div').attr('class', 'runlogs-summary');
    sug.append('div').attr('class', 'worklogs-summary')
    su.exit().remove();

    ss = sug.select('div.student-link').selectAll('a').data((d)=>[{id:d.id, key:d.key}]);
    ssg = ss.enter().append('a').attr('href', (d)=>'#student-'+d.id).text((d)=>d.key).merge(ss);
    ss.exit().remove();

    st = sug.select('div.testlogs-summary').selectAll('span').data((d)=>{ /* console.log('srd',d.latestTest);*/ return d.latestTest||[]});
    stg = st.enter().append('span').attr('class', (d)=>d.key).attr('title', (d)=>d.title).text((d)=>d.value, (d)=>d.key).merge(st);
    // srg = sr.enter().append('span').attr('class', (d)=>d.key).text((d)=>d.value, (d)=>d.key).merge(sr);
    // console.log('sr', sr._enter[0], sr._exit[0]);
    st.exit().remove();
    
    sr = sug.select('div.runlogs-summary').selectAll('span').data((d)=>{ /* console.log('srd',d.latestRun);*/ return d.latestRun||[]});
    srg = sr.enter().append('span').attr('class', (d)=>d.key).attr('title', (d)=>d.title).text((d)=>d.value, (d)=>d.key).merge(sr);
    // srg = sr.enter().append('span').attr('class', (d)=>d.key).text((d)=>d.value, (d)=>d.key).merge(sr);
    // console.log('sr', sr._enter[0], sr._exit[0]);
    sr.exit().remove();
    
    sw = sug.select('div.worklogs-summary').selectAll('span').data((d)=>{ /*() console.log('swd',d.latestWork);*/ return d.latestWork||[]});
    swg = sw.enter().append('span').attr('class', (d)=>d.key).attr('title', (d)=>d.title).text((d)=>d.value, (d)=>d.key).merge(sw);
    // console.log('sw', sw._enter[0], sw._exit[0]);
    sw.exit().remove();


    // per user detailed statistics
    mu = d3.select('#stat-details').selectAll('div').data(mx, (d)=>d.key);
    // console.log('mu', mu._enter[0], mu._exit[0]);
    mug = mu.enter().append('div').attr('class', 'student-container').attr('id',(d)=>'student-'+d.id).merge(mu);
    mug.append('div').attr('class','student').text((d)=>d.key);
    mu.exit().remove();

    mv= mug.selectAll('div.work-container').data((d)=>d.value, (d)=>d.key);
    // console.log('mv', mv);
    mvg = mv.enter().append('div').attr('class', 'work-container')
            .on('click', (d)=>testfunction(d))
            .merge(mv);
    mvg.append('div').attr('class', 'work').text((d)=>d.key);
    mvg.append('div').attr('class', 'testlogs')
    mvg.append('div').attr('class', 'runlogs')
    mvg.append('div').attr('class', 'worklogs')
    mv.exit().remove();
    
    rw = mvg.select('div.testlogs').selectAll('span').data((d)=>d.testlogs||[]);
    rwg = rw.enter().merge(rw).append('span').attr('class',(d)=>d.key).attr('title', (d)=>d.title).text((d)=>d.value, (d)=>d.key);
    rw.exit().remove();

    rw = mvg.select('div.runlogs').selectAll('span').data((d)=>d.runlogs||[]);
    rwg = rw.enter().merge(rw).append('span').attr('class',(d)=>d.key).attr('title', (d)=>d.title).text((d)=>d.value, (d)=>d.key);
    rw.exit().remove();
    
    ww = mvg.select('div.worklogs').selectAll('span').data((d)=>d.worklogs||[]);
    wwg = ww.enter().merge(ww).append('span').attr('class',(d)=>d.key).attr('title', (d)=>d.title).text((d)=>d.value, (d)=>d.key);
    ww.exit().remove();
}

const testfunction = (a) => {
    console.log(a);
    window.open('/work/student-exercise/'+a.student+'/'+a.exercise, '_student_exercise');
}

setInterval(updateMergelogs, 60000);

$('#set-start-time').click(async function() {
    startLogTime = $('#start-time').val();
    res = await initializeLogStats();
    $('#class-title').text(`Class Log Stats: ${classData.classId}`)
})