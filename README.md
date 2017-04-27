# Eyetracker
Pilot experiment using webgazer.js

# Running the app:
1. Download & install [Nodejs](https://nodejs.org/en/download/)
2. Go to the root folder of the project, in terminal enter: ```npm install```
3. Enter ```npm start -- <port> <demo/test>``` <sup>[1][2]</sup>
4. Example: ```npm start -- 8000 demo``` 
4. App should be available at ```localhost:8000/``` in demo mode.

*<sup>[1]</sup> npm start*
- ```npm start``` is a script that runs ```node app.js```
- Format: ```npm start -- <port> <demo /test>```
- The `--` makes sure the given arguments are being passed to the underlying command
- ```node app.js <port> <demo/test>``` works just as well


*<sup>[2]</sup> All operating systems should respond to ```npm start``` which runs the command ```node app.js```. 
If ```node``` has been reserved for some other application (Linux), you can also start the server by entering ```nodejs app.js``` in the terminal.*

# Project Structure
Views are pug templates which are rendered into html pages by the server

**Introduction**
- Views: index.pug, index2.pug (second round)
- Functions: intro.js

**Calibration**
- View: video.pug
- Functions: calibration.js 

**Watching & rating**
- View: video.pug
- Functions: video.js, rating.js, activity.js (server notifications)

# Detailed Project Structure

```
node_modules/
public/
  |-fonts/                    - contains fonts and icons needed for bootstrap styling
  |-css/                        - contains bootstrap and custom stylesheets
    |-bootstrap-paper.min.css   - bootstrap stylesheet
    |-calibration.css           - custom styling for calibration page
    |-video.css                 - custom styling for video page
  |-javascript/               - contains client-side code
    |-bootstrap.min.js          - controls bootstrap elements
    |-jquery-3.1.1.min.js       - jQuery library
    |-jquery-ui-min.js          - jQuery UI library
    |-webgazer.js               - webgazer library  
    |-activity.js               - handles server notification functions such as videostatus, ratings, surveys.
    |-calibration.js            - used for the calibration function on page /video
    |-intro.js                  - used to control the index page (user information, welcome message)
    |-video.js                  - used to control the video on the /video page
    |-rating.js                 - used to control all rating functions
views/                        - contains templates
  |-done.pug                    - Last page, displayed when the user finishes 2 rounds of the experiment
  |-error.pug                   - Error page when something goes wrong (server side or client side)
  |-index.pug                   - Index page, contains welcome message and the form for personal information 
  |-index2.pug                  - Introduction page for the second part of the experiment
  |-layout.pug                  - Main layout page, all other pages inherit from this page
  |-video.pug                   - Video page, contains rating and also the calibration step. Webgazer code runs here.
  |-postsurvey.pug              - The page containing the post-test survey after the experiment.
app.js                        - Server application, handles routing, logs and saves data to file.
package.json                  - Contains meta data and dependencies of project.
```
