/**
 * Created by Wing on 15-2-17.
 * Controls the events of the /video page.
 */
'use strict'

//region Youtube video player code
//---------------------------------------------------------------------------------------

var player = undefined;
var pstates = {};
var prevstate = undefined;

// Video changes depending on whether you're in stage 1 or 2
var videoIDs = ["SNmKom56HqE", "BW4Q9YQ2gAQ"];


// used to remember the fullscreen state of the video player
var isFullscreen = 0;
// closed caption is on by default.
var cc_on = true;
var autoHide = false;
var gazerpaused = false;

var resth;

// Most of the code here is from the Youtube api
// to change the video, see function onYouTubeIframAPIReady() below
// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
// This fires when the iframe is ready and loads the video
// change videoId for another video
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '467',
        width: '830',
        videoId: videoIDs[activity.getStageCount() - 1],
        playerVars: {
            modestbranding: 0,
            disablekb: 1,
            rel: 0,
            fs: 0,
            cc_load_policy: 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    videoUI.resetUI();
    // $('iframe').removeAttr('allowfullscreen');
    for (var key in YT.PlayerState) {
        pstates[YT.PlayerState[key]] = key;
    }
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        activity.startCollectingGazerData('/video/gazer');
        rating.enable();
        webgazer.resume();

        if (!prevstate) {
            videoUI.initVideoUI();
            prevstate = 1;
        } else {
            videoUI.enableAutoHide();
        } 
    } else if (event.data == YT.PlayerState.ENDED) {
        $('#btn-video-next').show();
        sendRemainingData();
        rating.pause();
        webgazer.pause();
    } else if (event.data == YT.PlayerState.PAUSED) {
        sendRemainingData();
        rating.pause();
        webgazer.pause();
        videoUI.disableAutoHide();
    }

    if (pstates[event.data] === "PLAYING" ||
        pstates[event.data] === "PAUSED" ||
        pstates[event.data] === "ENDED") {
        var status = pstates[event.data];
        activity.notifyVideo(status)
    }
}

function playVideo() {
    player.playVideo();
    videoUI.play();
}

function pauseVideo() {
    player.pauseVideo();
    videoUI.pause();
}

// Stops the youtube video
function stopVideo() {
    player.stopVideo();
}

function togglePlay() {
    if (pstates[player.getPlayerState()] === "PAUSED" ||
        pstates[player.getPlayerState()] === "CUED") {
        playVideo();
    } else if (pstates[player.getPlayerState()] === "PLAYING") {
        pauseVideo();
    }
}

//---------------------------------------------------------------------------------------
//endregion

//region UI and Mouse, button events
//---------------------------------------------------------------------------------------

// prevents congestion on server level because they share same route.
function sendRemainingData() {
    activity.stopCollectingGazerData();
}

/**
 * Used to (re) align rating box and fullscreen button.
 * Is called at load and whenever the user changes fullscreen mode.
 * all elements are relative to the video player.
 */

/**
 * Controls the toggling of fullscreen mode.
 */
function toggleFullscreenMode() {
}

// =============================================================================
// Player functions
// =============================================================================
// Closed captions function
$('#btn-video-cc').on('click', function () {
    if (cc_on) {
        player.unloadModule("captions");
        player.unloadModule("cc");
        videoUI.cc_off();
        activity.notifyVideo("cc_off");
        cc_on = false;
    } else {
        player.loadModule("captions");
        player.loadModule("cc")
        videoUI.cc_on();
        activity.notifyVideo("cc_on");
        cc_on = true;
    }
 
});

// toggle play state of player with play button
$('#btn-video-play').on('click', function () {
    togglePlay();
});

// toggle play state of player with overlay
$('#video-overlay').on('click', function () {
    togglePlay();
});

/**
 * Controls the FULLSCREEN option of the player
 */
$('#btn-video-fs').on('click', function () {
    videoUI.toggleFullscreen();    
});

// =============================================================================
// Page events
// =============================================================================
/**
 * temporary toggle to next the page
 */
$('#btn-next').on('click', function () {
    window.location.href = '/survey/postvideosurvey';
});

/**
 * pauses the webgazer
 */
$('#btn-togglegazer').on('click', function () {
    if (!gazerpaused) {
        webgazer.pause();
        gazerpaused = true;
    } else {
        webgazer.resume();
        gazerpaused = false;
    }
});

/**
 * close textbox
 * "slide" is the mode of showing, box will slide into screen
 * direction: which way the box will slide
 * time in ms for animation.
 */
$('#btn-text-ok').on('click', function () {
    $('.textContainer').hide("slide", { direction: "left" }, 300);
});

/**
 * When the user is done watching, next triggers what happens next
 * (second round or done page
 */
$('#btn-video-next').on('click', function () {
    activity.notifyStage('Video', 'Finish');
    sendRemainingData();
    window.location.href = '/survey/postvideosurvey';
});

//---------------------------------------------------------------------------------------
//endregion