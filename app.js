/**
 * Module dependencies.
 */
const express = require('express');
var moment = require('moment');
// app.locals.moment = require('moment');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
// const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');

const upload = multer({ dest: path.join(__dirname, 'uploads') });

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env.example' });

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const latihanController = require('./controllers/latihan');
// const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');
const classController = require('./controllers/class');
const exerciseController = require('./controllers/exercise');
const quisController = require('./controllers/quis');
const quisStudentController = require('./controllers/quisStudent');
const courseController = require('./controllers/course');
const workController = require('./controllers/work');
const runController = require('./controllers/run');
const runlogController = require('./controllers/runlog');
const testlogController = require('./controllers/testlog');
const discussionController = require('./controllers/discussion');

const socketioController = require('./controllers/socketio');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
//app.use(expressStatusMonitor());
app.use(compression());
// app.use(sass({
//   src: path.join(__dirname, 'public'),
//   dest: path.join(__dirname, 'public')
// }));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB_URI,
    autoReconnect: true,
    clear_interval: 3600
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  if (req.path === '/api/upload') {
    next();
  } else {
    // lusca.csrf()(req, res, next);
    next();
  }
});
//app.use(lusca.xframe('SAMEORIGIN'));
//app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
    req.path !== '/login' &&
    req.path !== '/signup' &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)) {
    req.session.returnTo = req.originalUrl;
  } else if (req.user &&
    req.path === '/account') {
    req.session.returnTo = req.originalUrl;
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);


/**
 * Primary app routes.
 */
app.get('/', homeController.home);
app.get('/home',homeController.index);
app.get('/login', userController.getLogin);
app.get('/latihan', latihanController.latihan);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.get('/signup-roles', userController.getSignupRoles);
app.post('/signup', userController.postSignup);
app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/password-by-staff', passportConfig.isAuthenticated, userController.postUpdatePasswordByStaff);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);


/**
 * SPELL routes
 */

app.get('/class', passportConfig.isAuthenticated, classController.index);
app.post('/class',  passportConfig.isAuthenticated, classController.create);
app.get('/class/:classId', passportConfig.isAuthenticated, classController.getById);
app.get('/course/:courseId/class/:classId', passportConfig.isAuthenticated, classController.getById);
app.put('/class/:classId', passportConfig.isAuthenticated, classController.updateById);
app.get('/class/delete/:classId', passportConfig.isAuthenticated, classController.deleteById);
app.get('/classedit/:classId', passportConfig.isAuthenticated, classController.editById);

app.get('/classlog', passportConfig.isAuthenticated, classController.logIndex);
app.get('/classlog/:classId', passportConfig.isAuthenticated, classController.getLogsById);
app.get('/classlog-stats/:classId/:timestamp', /*passportConfig.isAuthenticated,*/ classController.getLogsStatsById);
app.get('/class-staff/:classId', passportConfig.isAuthenticated, classController.getStaffworkById);

app.get('/student', passportConfig.isAuthenticated, exerciseController.indexByStudent);
app.get('/exercise', passportConfig.isAuthenticated, exerciseController.index);
app.get('/exercise/:exerciseId', passportConfig.isAuthenticated, exerciseController.getById);
app.put('/exercise/:exerciseId', passportConfig.isAuthenticated, exerciseController.updateById);
// app.get('/exercise/:exerciseId', passportConfig.isAuthenticated, exerciseController.getExercise);
app.post('/exercise', passportConfig.isAuthenticated, exerciseController.create);


app.get('/quis', passportConfig.isAuthenticated, quisController.index);
app.get('/exercise/:exerciseId', passportConfig.isAuthenticated, exerciseController.getById);
app.put('/exercise/:exerciseId', passportConfig.isAuthenticated, exerciseController.updateById);
// app.get('/exercise/:exerciseId', passportConfig.isAuthenticated, exerciseController.getExercise);
app.post('/exercise', passportConfig.isAuthenticated, exerciseController.create);
app.get('/quis/:courseId/:quisId', passportConfig.isAuthenticated, quisController.getQuisById);
app.get('/quis/student/:courseId/:quisId', passportConfig.isAuthenticated, quisController.getQuisStudentById);
app.get('/course/:courseId/quis/add', passportConfig.isAuthenticated, quisController.add);
app.get('/course/preview/:courseId/moduleList', passportConfig.isAuthenticated, courseController.previewModuleList);
app.get('/course/quis/delete/:courseId/:quisId',passportConfig.isAuthenticated, quisController.deleteQuisById)
app.post('/quis',  passportConfig.isAuthenticated, quisController.create);
app.post('/quis/student',  passportConfig.isAuthenticated, quisStudentController.create);
app.get('/course', passportConfig.isAuthenticated, courseController.index);
app.get('/course/livecourses/:courseId', passportConfig.isAuthenticated, courseController.livecourses);

app.get('/course/:courseId', passportConfig.isAuthenticated, courseController.getById);
app.get('/studentcourses', passportConfig.isAuthenticated, courseController.indexByStudent);
app.get('/course/student/:courseId', passportConfig.isAuthenticated, courseController.getByStudent);
app.put('/course/:courseId', passportConfig.isAuthenticated, courseController.updateById);
app.get('/course/delete/:courseId', passportConfig.isAuthenticated, courseController.deleteById);
app.get('/course/preview/:courseId', passportConfig.isAuthenticated, courseController.previewModuleById);
app.get('/course/preview/:courseId/:moduleId', passportConfig.isAuthenticated, courseController.previewModuleById2);
app.get('/course/preview/:courseId/:moduleId/:idSuccess', passportConfig.isAuthenticated, courseController.previewModuleById2);
app.post('/course',  passportConfig.isAuthenticated, courseController.create);
app.post('/course/:courseId', passportConfig.isAuthenticated, courseController.createModule);

app.get('/course/exercise/:courseId', passportConfig.isAuthenticated, courseController.getExerciseByCourse);
app.post('/course/exercise/:courseId', passportConfig.isAuthenticated, courseController.createExercise);

//classes
app.get('/course/class/:courseId', passportConfig.isAuthenticated, classController.index2);

//module
app.get('/course/:courseId/:moduleId', passportConfig.isAuthenticated, courseController.getModuleById);
app.get('/course/delete/:courseId/:moduleId', passportConfig.isAuthenticated, courseController.deleteModuleById);
// app.get('/course/delete/exercise/:exerciseId',passportConfig.isAuthenticated, courseController.deleteExerciseById);
app.put('/course/:courseId/:moduleId', passportConfig.isAuthenticated, courseController.updateModuleById);
//excersices
app.get('/course/exercise/:courseId/:exerciseId', passportConfig.isAuthenticated, courseController.getExerciseById);
app.put('/course/exercise/:courseId/:exerciseId', passportConfig.isAuthenticated, courseController.updateExerciseById);
app.get('/course/exercise/delete/:courseId/:exerciseId',passportConfig.isAuthenticated, courseController.deleteExerciseById)



app.get('/work/class/:classId', passportConfig.isAuthenticated, workController.indexByClass);
app.get('/work/student/:studentId', passportConfig.isAuthenticated, workController.indexByStudent);
app.get('/work/exercise/:exerciseId', passportConfig.isAuthenticated, exerciseController.indexByStudentMiddleware, workController.getByExercise);
app.get('/work/student-exercise/:studentId/:exerciseId', passportConfig.isAuthenticated, workController.getByStudentExercise);
app.post('/work',  passportConfig.isAuthenticated, workController.create);
app.put('/work/:workId',  passportConfig.isAuthenticated, workController.updateById);
app.post('/worklog', passportConfig.isAuthenticated, workController.addWorkLog)

app.get('/run/work/:workId', passportConfig.isAuthenticated, runController.getByWork);
// app.get('/run/test/:runId', passportConfig.isAuthenticated, runController.getTestByRun);
app.get('/run/test/:workId', passportConfig.isAuthenticated, runController.getTestByWork);

app.post('/runlog', passportConfig.isAuthenticated, runlogController.create);
app.post('/testlog', passportConfig.isAuthenticated, testlogController.create);

app.get('/discussion/:courseId/:moduleId', passportConfig.isAuthenticated, discussionController.getDiscussionByModule);
app.get('/quis/student/:courseId/:quisId', passportConfig.isAuthenticated, quisController.getQuisStudentById);
app.get('/course/:courseId/forum/add', passportConfig.isAuthenticated, discussionController.add);
app.get('/course/quis/delete/:courseId/:quisId',passportConfig.isAuthenticated, quisController.deleteQuisById)
app.post('/forum',  passportConfig.isAuthenticated, discussionController.createForum);
app.post('/quis/student',  passportConfig.isAuthenticated, quisStudentController.create);
app.get('/course/:courseId/forum/:forumId', passportConfig.isAuthenticated, discussionController.getForumById);
app.post('/forum/discussion', passportConfig.isAuthenticated, discussionController.create);
app.post('/discussion', passportConfig.isAuthenticated, discussionController.create);
/*
*
 * API examples routes.
 */
// app.get('/api', apiController.getApi);
// app.get('/api/lastfm', apiController.getLastfm);
// app.get('/api/nyt', apiController.getNewYorkTimes);
// app.get('/api/aviary', apiController.getAviary);
// app.get('/api/steam', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getSteam);
// app.get('/api/stripe', apiController.getStripe);
// app.post('/api/stripe', apiController.postStripe);
// app.get('/api/scraping', apiController.getScraping);
// app.get('/api/twilio', apiController.getTwilio);
// app.post('/api/twilio', apiController.postTwilio);
// app.get('/api/clockwork', apiController.getClockwork);
// app.post('/api/clockwork', apiController.postClockwork);
// app.get('/api/foursquare', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFoursquare);
// app.get('/api/tumblr', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTumblr);
// app.get('/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);
// app.get('/api/github', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGithub);
// app.get('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTwitter);
// app.post('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postTwitter);
// app.get('/api/linkedin', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getLinkedin);
// app.get('/api/instagram', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getInstagram);
// app.get('/api/paypal', apiController.getPayPal);
// app.get('/api/paypal/success', apiController.getPayPalSuccess);
// app.get('/api/paypal/cancel', apiController.getPayPalCancel);
// app.get('/api/lob', apiController.getLob);
// app.get('/api/upload', apiController.getFileUpload);
// app.post('/api/upload', upload.single('myFile'), apiController.postFileUpload);
// app.get('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getPinterest);
// app.post('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postPinterest);
// app.get('/api/google-maps', apiController.getGoogleMaps);

/**
 * OAuth authentication routes. (Sign in)
 */
// app.get('/auth/instagram', passport.authenticate('instagram'));
// app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), (req, res) => {
//   res.redirect(req.session.returnTo || '/');
// });
// app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));
// app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
//   res.redirect(req.session.returnTo || '/');
// });
// app.get('/auth/github', passport.authenticate('github'));
// app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
//   res.redirect(req.session.returnTo || '/');
// });
// app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
// app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
//   res.redirect(req.session.returnTo || '/');
// });
// app.get('/auth/twitter', passport.authenticate('twitter'));
// app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), (req, res) => {
//   res.redirect(req.session.returnTo || '/');
// });
// app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
// app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), (req, res) => {
//   res.redirect(req.session.returnTo || '/');
// });

/**
 * OAuth authorization routes. (API examples)
 */
// app.get('/auth/foursquare', passport.authorize('foursquare'));
// app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), (req, res) => {
//   res.redirect('/api/foursquare');
// });
// app.get('/auth/tumblr', passport.authorize('tumblr'));
// app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), (req, res) => {
//   res.redirect('/api/tumblr');
// });
// app.get('/auth/steam', passport.authorize('openid', { state: 'SOME STATE' }));
// app.get('/auth/steam/callback', passport.authorize('openid', { failureRedirect: '/api' }), (req, res) => {
//   res.redirect('/api/steam');
// });
// app.get('/auth/pinterest', passport.authorize('pinterest', { scope: 'read_public write_public' }));
// app.get('/auth/pinterest/callback', passport.authorize('pinterest', { failureRedirect: '/login' }), (req, res) => {
//   res.redirect('/api/pinterest');
// });

/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
const appServer = require('http').createServer(app);

appServer.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});
// const appServer = app.listen(app.get('port'), () => {
//   console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
//   console.log('  Press CTRL-C to stop\n');
// });
var io = require('socket.io')(appServer);
var redis = require('socket.io-redis');
io.adapter(redis({host:'127.0.0.1', port:6379}));
socketioController.set(io);
socketioController.start();

//Listening Ports With Socket Io

io.on('connection', (socket) => {
  console.log('Someone Connected !');
  
  socket.on('disconnect', () => {
      console.log('Someone Disconnected !');
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('typing', (msg) => {
    socket.broadcast.emit('typing', msg);
  });

  socket.on('ices', (msg) => {
    console.log(msg);
    io.emit('ices', msg);
  });



});

//End Listening Port With Socket Io


module.exports = app;
