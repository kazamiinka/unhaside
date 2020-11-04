const User = require('../models/User');
const Class = require('../models/Class');
const Exercise = require('../models/Exercise');
const Work = require('../models/Work');
const Run = require('../models/Run');
const md5 = require('blueimp-md5')
const esprima = require('esprima')
const estraverse = require('estraverse')
const escodegen = require('escodegen')
const cheerio = require('cheerio')
const jsStringEscape = require('js-string-escape')
const acorn = require('acorn')
// const acornWalk = require('acorn-walk')
/**
 * GET /run/work/:workId
 * get one run
 */

const trycatchGlobal = function(gvar) {
    return "try { \
    \
    spellRuntime.globalVars = () => { try { return {"
    + gvar.map((e) => { return '"'+e+'":'+e; }).join(', ') +
    "}}catch(e) { return {};} };\
    } catch(e) {\
        console.error('error',e);\
        spellRuntime.logToParent([Date.now(), 'runtimeError', 'script', String(e)]);\
    }";
}

const trycatch = 
"try { \
\
} catch(e) {\
    console.error(e);\
    spellRuntime.logToParent([Date.now(), 'runtimeError', arguments.callee.name, String(e)]);\
}\
finally {\
}";

// return "        if (event) {\
//     logToParent([Date.now(), 'element', event.currentTarget.outerHTML.replace(/>.*/,'>'), event.type, \
//     arguments.callee.name, !!arguments.callee.caller, Array.from(arguments), "
//     +(loc ? "'"+[loc.start.line,loc.start.column,loc.end.line,loc.end.column].join(',')+"'" : "''")+
//     "]);\

const showargs = function(loc, gvar, startOrEnd) {
    return "        if (event) {\
    spellRuntime.logEvent(event, arguments, "
    + (loc ? "'"+[loc.start.line,loc.start.column,loc.end.line,loc.end.column].join(',')+"'" : "''")
    // + ", { "+gvar.map((e) => { return '"'+e+'":'+e; }).join(', ') + " }, '" + startOrEnd + "');\
    + ", '" + startOrEnd + "');\
  }\
";
}

const modifyJS = function (workJs) {
    try {
        var myAst = esprima.parseScript(workJs, {loc:true});
    }
    catch(e) {
        return "try { \n\n\n"
            + workJs
            + "\n\n\n} catch(e) {console.error('error',e);spellRuntime.logToParent([Date.now(), 'runtimeError', 'script', String(e)]);}";
    }
    var funcParent
        , fBodyArray = []
        , fGlobalVar = []
        ;

    estraverse.traverse(myAst, {
        enter: function (node, parent) {
            if (node.type == 'FunctionDeclaration') {
                // console.log(node);
                // console.log('parent', parent);
                // console.log('varDecl', varDeclParent == myast);
    
                if (parent == myAst) {
                    fBodyArray.push(node);
                }
                return estraverse.VisitorOption.Skip;
            }
            if (node.type == 'FunctionExpression') {
                // console.log(node.body.body);
                // console.log('FunctionExpression:parent', funcParent == myast, parent);
                // console.log('varDecl', varDeclParent == myast);
    
                if (funcParent == myAst) {
                    fBodyArray.push(node)
                }
                return estraverse.VisitorOption.Skip;
            }
    
            if (node.type == 'VariableDeclaration') {
                if (parent == myAst) {
                    funcParent = parent;
                    // console.log('VariableDeclaration', node);
                    try {
                        node.declarations.forEach(function(el) {
                            if (el.init == null || el.init.type == 'Literal') {
                                fGlobalVar.push(el.id.name);
                            }
                        });
                    } catch(e) {}
    
                }
                else {
                    funcParent = null;
                    return estraverse.VisitorOption.Skip;
                }
            }
    
            if (node.type == 'ExpressionStatement') {
                if (parent == myAst) {
                    funcParent = parent;
                    // console.log('ExpressionStatement', node);
                    try {
                        if (node.expression.operator == '='
                            && node.expression.left.type == 'Identifier'
                            && node.expression.right.type == 'Literal') {
                                if (fGlobalVar.indexOf(node.expression.left.name) < 0)
                                    fGlobalVar.push(node.expression.left.name);
                            }
                    } catch(e) {}
                }
                else {
                    funcParent = null;
                    return estraverse.VisitorOption.Skip;
                }
            }
            },
        leave: function (node, parent) {
        }
    });
    
    fBodyArray.forEach(function(n) {
        // add try-catch-finally in a function
        var sastStart = esprima.parseModule(showargs(n.loc, fGlobalVar, 'start'));
        var sastEnd = esprima.parseModule(showargs(n.loc, fGlobalVar, 'end'));
        // console.log(sast);
        var tcast = esprima.parseModule(trycatch);
        tcast.body[0].finalizer.body = sastEnd.body;
        n.body.body.unshift(...sastStart.body);
        // n.body.body.push(...sastEnd.body);
        tcast.body[0].block.body = n.body.body;
        n.body.body = tcast.body;
    });

    // create a global try-catch
    // var tcastGlobal = esprima.parseScript(trycatchGlobal(fGlobalVar));
    // tcastGlobal.body[0].block.body.unshift(...myAst.body);
    
    // return escodegen.generate(tcastGlobal);              
    return escodegen.generate(myAst);              
}

const overrideScript = '<script src="/js/spell-override.js"></script>';

function combineWorkForRawRun(work) {
    const $ = cheerio.load(work.html);

    // remove all local scripts
    $('script[src]').toArray()
    .map((elm, idx) => { if (!/(^https?:|^\/\/)/.test(elm.attribs.src)) return idx })
    .reverse()
    .forEach((elNum) => {
        if (elNum != undefined) {
            $('script[src]').eq(elNum).remove()
        }
    });
    
    $('head').append('<style>\n'+work.css+'\n</style>');
    $('body').append('<script>\n'
        + work.js
        +'\n</script>');

    // console.log($.html());
    return $.html();
}

function combineWorkForRun(work) {
    const $ = cheerio.load(work.html);
    
    $('head').append('<style>\n'+work.css+'\n</style>');
    $('head').append(overrideScript);

    $('body').append('<script>\n'
        + modifyJS(work.js)
        + '\n\nspellRuntime.observer.observe(document.body, {childList: true, '
        + 'attributes: true, '
        + 'characterData: true, '
        + 'subtree: true, '
        + 'attributeOldValue: true, '
        + 'characterDataOldValue: true '
        + '});\n'
        +'</script>');

    // console.log($.html());
    return $.html();
}

const overrideTestScript = '<script src="/js/spell-test-override.js"></script>';
const mochaCss = '<link href="/css/mocha.css" rel="stylesheet" />';
const mochaScript = '<script src="/js/mocha.js"></script>';
const chaiScript = '<script src="/js/chai.js"></script>';
const sinonScript = '<script src="/js/sinon.js"></script>';
const jqueryScript = '<script src="/js/lib/jquery-3.1.1.min.js"></script>';
const chaiJqueryScript = '<script src="/js/chai-jquery.js"></script>';
const acornwalkScript = '<script src="/js/acornwalk.js"></script>';

// const mochaSetupScript = '<script src="/js/test-setup.js"></script>';
// const mochaRunScript = '<script>mocha.checkLeaks(); mocha.globals(["jQuery"]); mocha.run();</script>';
const mochaRunScript = '<script>mocha.globals(["jQuery"]); mocha.run();</script>';

// function combineRunForTest(runData) {
//     const $ = cheerio.load(runData.work.html);
    
//     $('head')
//     .append('<style>\n'+runData.work.css+'\n</style>')
//     .append(mochaCss)
//     .append(jqueryScript);
//     ;

//     $('body')
//     .prepend('<div id="mocha"></div>')

//     .append('<script>\n'+runData.work.js+'\n</script>')
//     .append(sinonScript)
//     .append(chaiScript)
//     .append(chaiJqueryScript)
//     .append(mochaScript)
//     .append(mochaSetupScript)
//     .append(mochaRunScript)
//     ;

//     console.log($.html());
//     return $.html();
// }


function combineWorkForTest(work) {
    const $ = cheerio.load(work.html);
    
    $('head')
    .append('<style>\n'+work.css+'\n</style>')
    .append(mochaCss)
    .append(jqueryScript)
    .append(overrideTestScript)
    ;

    // $('body script[src]').remove(); // remove any outside javascript from body
    $('body').html('<div id="__dut">'+$('body').html()+'</div>');

    $('body')
    .prepend('<div id="mocha"></div>')

    .append('<script>\n'+work.js+'\n</script>')
    .append(acornwalkScript)
    .append(sinonScript)
    .append(chaiScript)
    .append(chaiJqueryScript)
    .append(mochaScript)
    // .append('\n<script>\nconst dut_script = JSON.parse(\''+JSON.stringify(esprima.parse(work.js))+'\')\n\n'+work.exercise.testcode+'\n</script>\n')
    .append(`\n<script>\nconst dut_script_ast = "${encodeURI(JSON.stringify(acorn.parse(work.js)))}"\n\n${work.exercise.testcode}\n</script>\n`)
    .append(mochaRunScript)
    ;

    // console.log($.html());
    return $.html();
}

exports.getByWork = async (req, res) => {
    try {
        if (req.params.workId.length < 24 ) { // not an ObjectID
            res.status(404);
            return res.end('');
        }
        console.log(req.params.workId);
        var [runData, workData] = await Promise.all([
            Run.findOne({work:req.params.workId}).sort({updatedAt:-1}).exec(),
            Work.findById(req.params.workId)
                .populate('exercise').exec()
        ]);

        if (!workData || (req.user.role == 'student' && String(req.user._id) != String(workData.student))) {
            console.log(req.user.role, req.user._id, workData.student);
            res.status(404);
            res.end('<!DOCTYPE html><html lang="en"><head><title>Unauthorized</title></head><body>Unauthorized</body></html>')
            return;
        }

        if (req.query.raw && workData && (/(teacher|assistant)/.test(req.user.role) || String(req.user._id) == String(workData.student))) {
            console.log(req.user.role, req.user._id, workData.student);
            res.end(combineWorkForRawRun(workData));
            return;
        }

        // console.log(runData);
        if (runData && workData && runData.hash === workData.hash) {
            // console.log('old rundata');
        }
        else {
            runData = await (new Run({
                work: workData._id,
                combinedWork: combineWorkForRun(workData),
                hash: workData.hash,
            })).save();
        }
        res.end(runData.combinedWork.replace('<head','<head data-runid="'+runData._id+'"'));
        // res.json({exercise:exerciseData, work:workData, classdata:null});
    } catch(err) {
        console.log(err);
        res.status(500);
        res.end('');
    }
};

exports.getTestByWork = async (req, res) => {
    try {
        if (req.params.workId.length < 24 ) { // not an ObjectID
            res.status(404);
            return res.end('');
        }
        var workData = await Work.findById(req.params.workId)
            .populate('exercise')
            // .populate({path: 'work', populate: {path: 'exercise'}})
            .exec()
        // console.log(workData);

        res.end(combineWorkForTest(workData));
    } catch(err) {
        console.log(err);
        res.status(500);
        res.end('');
    }   
}

exports.getTestByRun = async (req, res) => {
    try {
        var runData = await Run.findById(req.params.runId)
            // .populate('work')
            .populate({path: 'work', populate: {path: 'exercise'}})
            .exec()
        // console.log(runData);

        res.end(combineRunForTest(runData));
    } catch(err) {
        console.log(err);
        res.status(500);
        res.end('');
    }   
}

/**
 * GET /work
 * get all works
 */
exports.index = async (req, res) => {
  var workList = await Work.find({}).exec();
//   console.log(workList);
//   function(err, workList) {
    return res.render('work/list', {works: workList});
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
          .populate('exercise')
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
      return res.render('work/edit', {ex: thisWork});
  } catch(err) {
      console.log(err);
      res.status(500);
  }
};


exports.updateById = (req, res, next) => {
    if (req.user && req.body.student == String(req.user._id)) {
        // console.log(arguments.callee.name, req.body);
        Work.findByIdAndUpdate(req.params.workId, {$set:req.body}, function(err, doc) {
            // console.log(err, doc);
            if (err)
                return res.status(500).json({code:500, error: err});
            return res.json({code:200});
        });
    }
    else
        return res.status(401).json({code:401});
};
