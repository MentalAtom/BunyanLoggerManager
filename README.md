# Bunyan Logger Manager
#### Express middleware to update the log level of your [Bunyan](https://github.com/trentm/node-bunyan) loggers over REST

[![npm version](https://badge.fury.io/js/bunyan-logger-manager.svg)](https://badge.fury.io/js/bunyan-logger-manager)
[![npm](https://img.shields.io/npm/dm/bunyan-logger-manager.svg)](https://www.npmjs.com/package/bunyan-logger-manager)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Coverage Status](https://coveralls.io/repos/github/MentalAtom/BunyanLoggerManager/badge.svg?branch=master)](https://coveralls.io/github/MentalAtom/BunyanLoggerManager?branch=master)
[![Build Status](https://travis-ci.org/MentalAtom/BunyanLoggerManager.svg?branch=master)](https://travis-ci.org/MentalAtom/BunyanLoggerManager)
```
npm install bunyan-logger-manager
```

**Example usage:**  
Include the module in your server.js and add it as middleware, passing in the loggers  
_IMPORTANT: the 'body-parser' package is required and should be added as middleware BEFORE this for this to work as expected*_
```javascript
// server.js
var bodyParser = require('body-parser')
var bunyanLoggerManager = require('bunyan-logger-manager')

var logger1 = bunyan.createLogger({
  name: "logger1",
  level: "INFO"
})

var logger2 = bunyan.createLogger({
  name: 'logger2',
  level: 'FATAL'
})

var app = express()

// bodyParser.json() must be used *before* this middleware
app.use(bodyParser.json())
app.use('/log-level', bunyanLoggerManager([logger1, logger2]))

app.listen(3000)
```

**GET '/log-level' for the current loggers and levels:**
```json
[
  {
    "loggerName": "logger1",
    "level": "INFO"
  },
  {
    "loggerName": "logger2",
    "level": "FATAL"
  }
]
```

**Update the log level using PUT to '/log-level':**  
Request body:
```javascript
/* PUT request body */
[
  {
    "loggerName": "logger1",
    "level": "WARN"
  }
]
```
The response body will be the same as the request if the update completed successfully (with status 200 - OK)
```javascript
/* 200 - OK */
[
  {
    "loggerName": "logger1",
    "level": "WARN"
  }
]
```
In the case of errors (e.g. invalid logger, logLevel), a 400 statusCode will be given with error messages:
```javascript
/* 400 - Bad Request */
[
  {
    "loggerName": "logger1",
    "level": "WARN",
    "errors": [
      "Invalid log level of 'UNICORN' specified"
    ]
  }
]
```
