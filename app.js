/**
 * Created by Wing on 13-2-17.
 * This is a nodejs server.
 * Most of the code is boilerplate such as necessary dependencies declarations,
 * setup of ip, port.
 */

//region Setup
//---------------------------------------------------------------------------------------

// dependencies:
var express = require('express');
var url = require('url');
var ip = require('ip');
var path = require('path');
var http = require('http');
var fs = require('fs');
var bodyParser = require('body-parser');
var mlog = require('morgan'); // request mlog
var log4js = require('log4js'); // common mlog (logging our messages to file)

var jsonfile = require('jsonfile') // responsible for writing data to file
jsonfile.spaces = 4

var surveypath = path.join(__dirname, 'surveys');
var surveystore = new Map();


// region DATA COLLECTION
// ------------------------------------------------------
var logsPath = 'logs/';
// create log file path, replace all : occurences for Windows
var logfile = logsPath + (new Date()).toISOString().replace(/:/g, '.');
var dataPath = 'data/';
// ------------------------------------------------------
// endregion

var logger = log4js.getLogger();

var ipaddress = ip.isPrivate(ip.address()) ? 'localhost' : ip.address();

// process.argv is the list of arguments given when executing the server.
// format: npm start -- <port> <demo /test>
// port: process.argv[2]
// mode: process.argv[3]

// Check if port given is a number
var port = (process.argv[2] !== undefined && !isNaN(process.argv[2]))
    ? parseInt(process.argv[2]) : 8000;

// Running the app in test or demo mode?
var mode = "TEST";
var apptype = "A";
var stable = 1;

// Check if mode is valid
if (process.argv[3] !== undefined && process.argv[3].toUpperCase() === "DEMO") {
    mode = "DEMO";
}

// Check if type is valid
if (process.argv[4] !== undefined && process.argv[4].toUpperCase() === "B") {
    apptype = "B";
}
 
if (process.argv[5] !== undefined && parseInt(process.argv[5]) === 2) {
    stable = 2;
}
    

var app = express();
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/survey', express.static(path.join(__dirname, 'public')));

// set up of the body parser
// this dependency is required to send json files
// the limit of 5mb means that it allows the posting of files <= 5mb
// this high limit is needed for the video tracking part as we send a lot of data there.
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({
    limit: '5mb',
    extended: true,
    parameterLimit: 5000
}));
app.locals.pretty = true;

app.use(mlog('common'));

/**
 * Sets up the app.
 * Initializes the logs folder if needed.
 */
app.listen(port, function () {
    // check if log folder exists
    if (!fs.existsSync(logsPath)) {
        console.log('Creating logs folder for log4js');
        fs.mkdirSync(logsPath);
    }

    // Logger to write logs to file.
    // to change the filename or folder, change the filename part below.
    log4js.configure({
        appenders: [
            { type: 'console' },
            { type: 'file', filename: logfile }
        ]
    });

    //check if data folder exists
    if (!fs.existsSync(dataPath)) {
        console.log('Creating data folder');
        fs.mkdirSync(dataPath);
    }

    readSurveys();

    logger.info('[%s] Node server started on %s:%d in %s mode type %s, subject keep their heads stable during video: %s',
        (new Date()).toLocaleTimeString(), ipaddress, port, mode, apptype, stable);
});


//---------------------------------------------------------------------------------------
//endregion

//region Data log setup
//---------------------------------------------------------------------------------------

var activity;
var calibration_gazer;
var video_gazer;
var user;
var dataIsWritten;
var user_clicks;

function initDatacollection() {
    activity = { "stage_changes": [] };
    calibration_gazer = [];
    video_gazer = [];
    user_clicks = [];
    dataIsWritten = false;
}

/**
 * Creates user's properties.
 * Called when a new user is made.
 * The id of the user is the ISO time string of creation.
 * It's also the name of the data JSON saved at the end.
 * <environment> contains windows and screen size/resizes
 */
function initUser() {
    var d = new Date();
    user = {};
    user.environment = {
        "initial": {},
        "resizes": []
    };
    user.id = d.toISOString().replace(/:/g, '.');
    user.surveys = [];
    user.ratings = [];
    user.ratingbells = [];
    user.videostatus = [];

    if (apptype === "A")
        user.stageCount = 0;
    else if (apptype === "B")
        user.stageCount = 3;

    user.round = 0;

    logger.info("User created: " + JSON.stringify(user));
    return user;
}

/**
 *  * Writes the recorded data to file.
 * File will be saved in folder <dataPath> (see above).
 * @returns {string} Filename of saved data.
 */
function writeToFile() {
    var filename = dataPath + 'data (' + user.id + ').json';

    if (dataIsWritten)
        return filename;

    //combine data
    var data = {
        activity: activity,
        user: user,
        calibration_gazer_predictions: calibration_gazer,
        video_gazer_predictions: video_gazer,
        user_clicks: user_clicks
    }

    logger.info("Data gathered: " + JSON.stringify(data));

    jsonfile.writeFile(filename, data, function (err) {
        if (err) {
            logger.error("Error writing file " + filename + "\n" + err);
        }

        dataIsWritten = true;
    });
    return filename;
}

function readSurveys() {
    fs.readdir(surveypath, function (err, files) {
        if (err) logger.error(err);

        files.forEach(function (f) {
            if (f.indexOf('.json') >= 0) {
                jsonfile.readFile(path.join(surveypath, f), function (err2, obj) {
                    if (err2) logger.error(err2);
                    var key = obj.survey_type + obj.survey_stage;
                    surveystore.set(key, obj);
                });
            }
        });
    });
}

//---------------------------------------------------------------------------------------
//endregion

/**
 * If we access localhost:8000/ , the server will render the index.jade view.
 */
app.get('/', function (req, res) {
    if (user === undefined) {
        initUser();
        initDatacollection();
        res.render('index', { title: mode + ': Eye-tracker experiment', mode: mode });
        logger.info("Entered experiment round 1");
    } else {
        res.redirect('/instructions');
        logger.info("Entered experiment round 2");
    }

    user.round += 1;
    if (user.round >= 2)
        user.round = 2;

    if (apptype === "A") {
        user.stageCount += 1;
        // cap on stagecount since there are only 2 stages
        if (user.stageCount > 2) user.stageCount = 2;
    } else if (apptype === "B") {
        user.stageCount -= 1;
        // cap on stagecount since there are only 2 stages
        if (user.stageCount < 1) user.stageCount = 1;
    }
});

/**
 * Post general user infomation
 * Environment contains information about the user's screen and browser size.
 */
app.post('/environment/:type', function (req, res) {
    if (user === undefined) res.end();
    var type = req.params.type;
    if (type === "initial") {
        user.environment.initial = req.body;
    } else if (type === "resize") {
        user.environment.resizes.push(req.body);
    }
    logger.info("Environment (" + type + "):" + JSON.stringify(req.body));
    res.end();
});

app.get('/survey/:type', function (req, res) {
    if (user === undefined) {
        res.redirect('/');
    } else {
        var type = req.params.type;
        var typestage = type + user.stageCount;
        var surveykey;

        switch (type) {
            case 'presurvey':
            case 'postsurvey':
                surveykey = type;
                break;
            default:
                surveykey = typestage;
        }
        if (surveystore.has(surveykey)) {
            res.render('survey', { title: mode + ': ' + type, mode: mode, round: user.round, data: surveystore.get(surveykey) });
        } else {
            res.render('error');
        }
    }
});

app.get('/instructions', function (req, res) {
    if (user === undefined) {
        res.redirect('/');
    } else {
        res.render('instructions', { title: mode + ': Instructions', mode: mode, round: user.round });
    }
});

app.post('/survey', function (req, res) {
    var data = req.body;
    user.surveys = user.surveys.concat(data);
    logger.info("Survey data added: " + JSON.stringify(data));
    res.status(200).end();
});

/**
 * Serves the calibration /video page
 */
app.get('/video', function (req, res) {
    if (user === undefined) {
        res.redirect('/');
    } else {
        var keepHeadStable = (user.round === stable) ? true : false;
        res.render('video', { title: mode + ': Video', mode: mode, stageCount: user.stageCount , round: user.round, keepHeadStable: keepHeadStable});
    }
});

/**
 * Serves the facechecker page
 */
app.get('/facecheck', function (req, res) {
    res.render('facecheck', { title: mode + ' Face checking', mode: mode });
});

/**
 * Logs the status of the video player.
 * The data is sent from the client as URL
 * format: /video/<status message>
 */
app.post('/videostatus', function (req, res) {
    if (user === undefined) res.end();
    user.videostatus.push(req.body);
    logger.info("Video: " + JSON.stringify(req.body));
    res.end();
})

/**
 * The gaze predictions from the watching stage is handled here.
 * params can be <gazer> or <clicks>
 *     <gazer> is the data of the gazer, automatically sent by client.
 *     <clicks> is the user clicks, sent at each click.
 */
app.post('/video/:type', function (req, res) {
    if (user === undefined) res.end();

    switch (req.params.type) {
        case "gazer":
            video_gazer = video_gazer.concat(req.body.data);
            logger.info("Received video gazer data batch of length: " + req.body.data.length);
            break;
       default:
        // do nothing
    }

    video_gazer = video_gazer.concat(req.body.data);
    logger.info("Received tracker data batch of length: " + req.body.data.length);
    res.end()
});

/**
 * Handles incoming userclicks.
 */
app.post('/userclicks', function(req, res) {
    if (user===undefined) res.end();
    user_clicks.push(req.body.data);
    logger.info("Received user clicks: " + JSON.stringify(req.body.data));
    res.end();
})

/**
 * Handles the calibration data coming in from the client.
 */
app.post('/calibration/:type', function (req, res) {
    if (user === undefined) res.end();

    switch (req.params.type) {
        case "gazer":
            calibration_gazer = calibration_gazer.concat(req.body.data);
            break;
        default:
        // do nothing
    }

    logger.info("Calibration data added: " + req.params.type);
    res.end();
});

/**
 * The rating information is being handled here.
 * After the user submits a rating, a rating object is created and added to the user.rating array.
 * Data is sent as URL, format:
 * /rate/ <rating> / <current video time in seconds> / <full video time in seconds>
 */
app.post('/rating/:type', function (req, res) {
    if (user === undefined) res.end();
    var type = req.params.type;
    var data = req.body;
    logger.info("Rating event recorded (" + type + "): " + JSON.stringify(data));
    switch (type) {
        case "rate":
            user.ratings.push(data);
            break;
        case "bell":
            user.ratingbells.push(data);
            break;
        default:
        // Do nothing.
    }
    res.end();
});

/**
 * After video playing is done.
 * If the user has done the experiment twice, they're sent to a 'post-survey' page.
 */
app.get('/next', function (req, res) {
    if (user === undefined)
        res.redirect('/');

    if (apptype === "A") {
        if (user.stageCount >= 2)
            res.redirect('survey/postsurvey');
        else res.redirect('/');
    } else if (apptype === "B") {
        if (user.stageCount <= 1)
            res.redirect('survey/postsurvey');
        else res.redirect('/');
    }
});

/**
 * Receives and logs the stage changes of the user.
 * The stage changes are sent from the client.
 */
app.post('/stagechange', function (req, res) {
    if (user === undefined) res.end();
    activity.stage_changes.push(req.body);
    logger.info(JSON.stringify(req.body));
    res.end();
});

/**
 * Last page of the app, thanks the user and has additional notes.
 * Calls writeToFile() which returns a filename to log.
 */
app.get('/done', function (req, res) {
    if (user === undefined)
        res.redirect('/');

    if (apptype === "A") {
        if (user.stageCount >= 2) {
            logger.info("Experiment has reached its ending.\n Data saved at: " + writeToFile());
            res.render('done', { title: mode + ': Done', mode: mode });
        } else {
            res.redirect('/');
        }
    } else if (apptype === "B") {
        if (user.stageCount <= 1) {
            logger.info("Experiment has reached its ending.\n Data saved at: " + writeToFile());
            res.render('done', { title: mode + ': Done', mode: mode });
        } else {
            res.redirect('/');
        }
    }
});

/**
 * returns current stagecount
 */
app.get('/getstagecount', function (req, res) {
    res.send({ "stageCount": user.stageCount });
});

/**
 * returns app mode (demo/test)
 */
app.get('/getappmode', function (req, res) {
    res.send({ "mode": mode });
});

/**
 * returns round count
 */
app.get('/getround', function (req, res) {
    res.send({ "round" : user.round});
});

/**
 * Resets the app.
 * When user is set to undefined, the whole experiment starts anew.
 */
app.get('/reset', function (req, res) {
    user = undefined;
    logger.info('----------------------------- App reset -----------------------------');
    res.redirect('/');
});

//region Error handling
//---------------------------------------------------------------------------------------
/*
 * From here just catching errors
 */
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});
//---------------------------------------------------------------------------------------
//endregion
