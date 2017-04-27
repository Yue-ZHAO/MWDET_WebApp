/**
 * Created by codesalad on 12-3-17.
 */
"use strict"

/**
 * Handles all survey functionality
 * Used by including this script and calling survey.<public function name>
 */
var survey = (function() {

    // object containing public functions
    var module = {};

    /**
     * Converts a serialized object into a json object.
     * @param {*} serialized serialized object.
     */
    function makeSerializedObject(serialized) {
        var objarr =serialized.split("&");
        var obj={};
        for(var key in objarr)
        {
            obj[decodeURIComponent(objarr[key].split("=")[0])] = decodeURIComponent(objarr[key].split("=")[1]);
        }
        return obj;
    }

    /**
     * Validates an email input.
     * Returns true if the email contains <prefix>@<some provider name> . <country code>
     * http://stackoverflow.com/a/46181
     * @param {*} email The email input given.
     */
    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    /**
     * Used to validate the inputs.
     * Works by iterating over all input elements and checking if they're 
     * serialized into the data object (will only happen if user fills in input). 
     * If not, add warning style to form-group. 
     * @param {*} id Id of the form containing the survey.
     * @param {*} data serialized data from the survey.
     */
    function validateData(id, data) {
        var validated = true;

        var numberValid = true;

        // email validation
        if ($('[name="email"]').length !== 0 && 
        !validateEmail($(document.getElementsByName('email')).val())) {
            alert("Please fill in a valid email-address");
            $(document.getElementsByName('email')).closest('.form-group').addClass('has-warning');
            return false;
        } else {
            if ($(document.getElementsByName('email')).closest('.form-group').hasClass('has-warning'))
                $(document.getElementsByName('email')).closest('.form-group').removeClass('has-warning');
        }

        // general input validation
       $('#' + id + ' input').each(function(i, v) {
            // loop through each input element inside form 
            var kname = $(v).attr('name');

            if (kname === 'email')
                return true; // skip this as we already check for email.

            if (!data.hasOwnProperty(kname) || data[kname].replace(/\s/g, '')  === "") {
                $(v).closest('.form-group').addClass('has-warning');
                validated = false;
            } else {
                if ($(v).closest('.form-group').hasClass('has-warning'))
                    $(v).closest('.form-group').removeClass('has-warning');
            }

            if ($(v).attr('type') === "number" && $(v).val() === "0") {
                $(v).closest('.form-group').addClass('has-warning');
                numberValid = false;
            } else {
                if ($(v).closest('.form-group').hasClass('has-warning'))
                    $(v).closest('.form-group').removeClass('has-warning');
            }
        });

        // text area validation
        $('textarea').each(function(i, v) {
            var kname = $(v).attr('name');
            if (!data.hasOwnProperty(kname) || data[kname].replace(/\s/g, '') === "") {
                $(v).closest('.form-group').addClass('has-warning');
                validated = false;
            } else {
                if ($(v).closest('.form-group').hasClass('has-warning'))
                    $(v).closest('.form-group').removeClass('has-warning');
            }
        });

        if (!validated)
            alert('Please fill in all fields!');

        if (!numberValid)
            alert('Please fill in a number greater than 0.')

        return validated && numberValid;
    }

    /**
     * Parses the form given by the id into a json object (data)
     * @param {*} id The id of the form containing the survey.
     * @param {*} type The type of the survey (presurvey, postsurvey, prevideosurvey...)
     */
    function parseForm(id, type) {
        var form = $('#' + id);

        if (!form.length) {
            console.error("Form #" + id + " doesn't exits!" );
            return;
        }

        var data = form.serialize();
        data = makeSerializedObject(data);
        if (!validateData(id, data)) {
            return null;
        }

        var d = new Date();
        data.time = d.toISOString();
        data.type = type;
        data.stage = activity.getStageCount();

        return data;
    }

    // Public functions

    /**
     * Public parse method. Calls inner parse method.
     * Redirects to next page if survey is filled in.
     */
    module.parse = function (id, type) {
        var data = parseForm(id, type);

        // if data is invalid (parseForm checks for this), do nothing.
        if (data === null)
            return;

        $.post('/survey', data, function() {
            // determine where to go next after survey
            switch(type) {
                case "presurvey":
                    // window.location.href = '/survey/prevideosurvey';
                    window.location.href = '/instructions';
                    break;
                case "postsurvey":
                    window.location.href = '/done';
                    break;
                case "prevideosurvey":
                    window.location.href = '/facecheck';
                    break;
                case "postvideosurvey":
                    window.location.href = '/next';
                    break;
                default:
                    window.location.href = '/error';
            }
        });
    }

    return module;
}) ();