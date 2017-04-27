/**
 * Created on 01/04/2017
 * video_ui manages only the video player UI, not the functions.
 * for the rest of the events on /video, see video.js
 */

"use strict"

var videoUI = (function () {

    // public functions object to be returned
    var module = {}

    // =========================================================================
    // Parameters
    // =========================================================================
    // fullscreen
    var isFullscreen = false;

    // captions
    var cc_on = true;

    // ui
    var ui_autohide = false;
    // available empty vertical space used for centering videoplayer.
    var resth;



    // =========================================================================
    // private functions
    // =========================================================================
    function init() {
        // =====================================================================
        // eventlisteners
        // =====================================================================
        // closed caption button
        $('#btn-video-cc').on('click', function () {
            if (cc_on) {
                player.unloadModule("captions");
                player.unloadModule("cc");
                cc_on = false;
                activity.notifyVideo("cc_off");
            } else {
                player.loadModule("captions");
                player.loadModule("cc")
                cc_on = true;
                activity.notifyVideo("cc_on");
            }
        });

        // video overlay (invisible element covers video for full page control)
        $('#video-overlay').hover(function () {
            $('#btn-video-bar').stop().fadeIn('fast');
        }, function () {
            if (ui_autohide && $('#btn-video-bar:hover').length === 0) {
                $('#btn-video-bar').stop().fadeOut('slow');
            }
        });

        // video player bottom bar with player functions
        $('#btn-video-bar').on('mouseleave', function () {
            if (ui_autohide)
                $(this).stop().fadeOut('slow');
        });

        // calculate available space.
        resth = $('.container').height() - $('.header').outerHeight() - $('.buttonsContainer').outerHeight() - $('iframe').height() - 10;

        // Change video container's height to fit page perfectly
        module.smallPlayer();
    }

    // =========================================================================
    // public functions
    // ========================================================================= 
    // initialies module
    module.init = function () {
        init();
    }

    // initalize video ui
    module.initVideoUI = function () {
        $('#btn-video-cc').prop('disabled', false);
        setTimeout(function () {
            $('#btn-video-bar').fadeOut('slow');
            ui_autohide = true;
        }, 2900);
    }

    // resets video ui. Called at start and when fullscreen state changes.
    module.resetUI = function () {
        var h = 35;
        // get the video player's x position
        var r = $('iframe').position().left;
        // get the video player's height
        var b = $('iframe').position().top + $('iframe').height() - h;
        // snap the fullscreen button to the lower right corner with offset 11px

        $('#btn-video-bar').css('width', $('iframe').width());
        $('#btn-video-bar').css('top', b);

        $('#video-overlay').css('width', $('iframe').width());
        $('#video-overlay').css('height', $('iframe').height());
    }

    // Changes the player to big player (in-browser fullscreen)
    module.bigPlayer = function () {
        // remove video player's top margin for fullscreen
        $('.videoContainer').css('margin-top', 0);

        // use 95% of the page's height for fullscreen
        $('iframe').height($('.container').height() - $('.buttonsContainer').outerHeight() - 10);

        // use 100% of page's width for fullscreen
        $('iframe').width($('body').width());

        // hide the title header
        $('.header').hide();

        // set background to dark
        $('body').css('background-color', "#020202");
    }

    // Changes the player to small player
    module.smallPlayer = function () {
        // Reset player's top margin so that it's relatively vertically centered
        $('.videoContainer').css('margin-top', resth);

        // Change player's size
        $('iframe').height(467);
        $('iframe').width(830);

        // show title header
        $('.header').show();

        // reset the body's css style
        $('body').removeAttr('style');
    }

    // Toggles fullscreen mode.
    module.toggleFullscreen = function () {
        // if not fullscreen
        if (isFullscreen === false) {
            module.bigPlayer();
            $('#btn-video-fs').removeClass('vcontrol').addClass('vcontrolOn');
            // notifyStage server of fullscreen mode change
            activity.notifyVideo("Fullscreen_enter");
            isFullscreen = true;
        } else {
            module.smallPlayer();
            $('#btn-video-fs').removeClass('vcontrolOn').addClass('vcontrol');
            // notifyStage server
            activity.notifyVideo("Fullscreen_exit");
            isFullscreen = false;
        }
        module.resetUI();
    }

    // change UI to play mode
    module.play = function () {
        $('#btn-video-play').removeClass('glyphicon-play').addClass('glyphicon-pause');
    }

    // change UI to pause mode
    module.pause = function () {
        $('#btn-video-play').removeClass('glyphicon-pause').addClass('glyphicon-play');
    }

    // change closed captions UI to off
    module.cc_off = function () {
        $('#btn-video-cc').removeClass('vcontrolOn').addClass('vcontrol');
    }

    // change closed captions UI to on
    module.cc_on = function () {
        $('#btn-video-cc').removeClass('vcontrol').addClass('vcontrolOn');
    }

    // enables auto hide of video bar
    module.enableAutoHide = function () {
        ui_autohide = true;
    }

    // disables auto hide of video bar
    module.disableAutoHide = function () {
        ui_autohide = false;
    }

    return module;
})();

$(document).ready(function() {
    videoUI.init();
});