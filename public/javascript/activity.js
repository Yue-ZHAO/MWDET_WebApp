/**
 * Created by codesalad on 4-3-17.
 */
"use strict"
/**
 * Notifies server of status changes
 * @type {{notify: activity.notifyStage, notifyVideo: activity.notifyVideo, rate: activity.rate}}
 */
var activity = (function () {

    var stageCount = undefined;
    var appMode = undefined;
    var round = undefined;

    // tracker data collection
    var collectionInterval = 200; //in ms
    var trackerRoute = undefined;
    var trackerData = [];
    var trackerInterval;

    var resizeData;
    var resizeCheckInterval;
    var resizeWait = false;
    /**
     * Initializes the module.
     * Gets stagecount and appmode so that other files can retrieve these data.
     */
    function init() {
        $.get('/getstagecount', function (res) {
            stageCount = res.stageCount;
        });

        $.get('/getappmode', function (res) {
            appMode = res.mode;
        });

        $.get('/getround', function(res) {
            round = res.round;
        });

        // eventlistener for window resizes
        // data is sent to server.
        $(window).resize(function () {
            resizeData = {
                "time": (new Date()).toISOString(),
                "window_height": $(window).height(),
                "window_width": $(window).width()
            }

            if (!resizeWait) {
                resizeCheckInterval = setInterval(function () {
                    if (resizeData.window_height !== $(window).height()
                        && resizeData.window_width !== $(window).width())
                        return;

                    sendResizeData();
                }, 5000);
                resizeWait = true;
            }


        });
    }

    // send resize data to server.
    function sendResizeData() {
        if (!resizeData) return;
        clearInterval(resizeCheckInterval);
        resizeWait = false;
        $.post('/environment/resize', resizeData);
    }

    //region tracker data collection
    //---------------------------------------------------------------------------------------
    /**
     * Starts collecting webgazer predictions.
     * Every 200ms, data is polled from webgazer
     * @param route The route the data will ben sent to. ex: '/video_gazer'
     */
    function startCollecting(route) {
        trackerRoute = route; // initialize route for sending data

        console.log("Starting collecting webgazer data, will send to: " + route);
        trackerInterval = setInterval(function () {
            var prediction = webgazer.getCurrentPrediction();

            if (!prediction)
                return;

            var d = new Date();

            var data = {
                'gazerX': prediction.x,
                'gazerY': prediction.y,
                'time': d.toISOString(),
                "videoTime": (player === undefined) ? "N/A (calibration)" : player.getCurrentTime(),
                "videoDuration": (player === undefined) ? "N/A (calibration)" : player.getDuration(),
                "stage": stageCount
            }

            trackerData.push(data);

            if (trackerData.length >= 300) {
                sendTrackerData();
                console.log("Tracker data sent to server");
            }
        }, collectionInterval);
    }

    // stop collecting gazer data
    function stopCollecting() {
        console.log("Stopping collecting gazer data, sending remaining data");
        sendTrackerData();
        clearInterval(trackerInterval);
    }

    // send gazer data to server
    function sendTrackerData() {
        $.post(trackerRoute, { data: trackerData });
        trackerData = [];
    }

    // =========================================================================
    // click collection
    // =========================================================================
    function startCollectingClicks() {
        console.log("User clicks are being logged.");

        $(document).on('click', function (event) {
            var data = {
                'page': document.title + round,
                'clickX' : event.clientX,
                'clickY' : event.clientY,
                'time': (new Date()).toISOString()
            }

            if ($(event.target).is('html')) {
                data.element = "background";
            } else if (event.target.id && event.target.id !== "") {
                data.elementId = event.target.id;
            } else if (event.target.className && event.target.className !== "") {
                data.elementClass = event.target.className;
            } else {
                data.element = event.target.outerHTML;
            }
 
            $.post('/userclicks', {data: data});

        });
   }

    
    //---------------------------------------------------------------------------------------
    //endregion

    // return object
    var module = {};

    /**
     * Initializes the activity module
     */
    module.init = function () {
        init();

        // also collect user clicks
        startCollectingClicks();
    }

    module.startCollectingGazerData = function (route) {
        startCollecting(route);
    }

    module.stopCollectingGazerData = function (route) {
        stopCollecting();
    }

    /**
     * Notifies server whenever a stage (calibration/video start/finish) has changed.
     * @param stage Calibration or video stage
     * @param status The status of the stage: started or finished.
     */
    module.notifyStage = function (stage, status) {
        var d = new Date();
        var time = d.toISOString();

        var data = {
            "time": time,
            "type": "study_step_change",
            "step": stage + "_" + stageCount,
            "status": status
        }

        $.post('/stagechange', data);
    };

    /**
     * Notifies server whenever a video state has changed.
     * @param status The state of the video i.e. paused, playing, ended
     * @param videotime Current time of the video in seconds
     * @param videoduration Duration of the video in seconds.
     */
    module.notifyVideo = function (status) {
        var d = new Date();
        var time = d.toISOString();

        var data = {
            "time": time,
            "status": status,
            "videoTime": player.getCurrentTime(),
            "videoDuration": player.getDuration(),
            "stage": stageCount
        };

        $.post('/videostatus', data);
    };

    /**
     * Returns the stagecount <1 or 2>
     * @returns stageCount
     */
    module.getStageCount = function () {
        return stageCount;
    }

    /**
     * Returns the appMode, this can either be demo or test
     * @returns appMode
     */
    module.getAppMode = function () {
        return appMode;
    }

    /**
     * Returns round count
     * @returns round
     */
    module.getRound = function () {
        return round;
    }

    return module;
})();

activity.init();
