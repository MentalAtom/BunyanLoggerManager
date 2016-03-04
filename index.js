'use strict'

const LOGLEVEL_MAP = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARN',
  50: 'ERROR',
  60: 'FATAL'
}

// Resolve the method name for the log level
const resolveLogLevel = (level) => {
  let resolvedLevel = level
  if (typeof level === 'number') {
    resolvedLevel = LOGLEVEL_MAP[level]
  }
  return resolvedLevel
}

// Check if a given log level is valid
const validateLogLevel = (level) => {
  if (typeof level === 'string') {
    return Object.keys(LOGLEVEL_MAP).map(key => LOGLEVEL_MAP[key]).indexOf(level) > -1
  } else if (typeof level === 'number') {
    return LOGLEVEL_MAP[level]
  }
  return false
}

// Generate the JSON formatted list of loggers
const getJsonListOfLoggers = (loggers) => {
  return (loggers || []).map(logger => {
    return {
      loggerName: logger.fields.name,
      level: LOGLEVEL_MAP[logger.level()]
    }
  })
}

const middleware = (loggers) => {
  let LOGGER_LIST = getJsonListOfLoggers(loggers)

  // Throw an error if bodyParser isn't installed as we need this
  try {
    require.resolve('body-parser')
  } catch (e) {
    throw new Error('body-parser is not installed, run \'npm install body-parser\' and add the bodyParser.json() middleware for BunyanLoggerManager to work')
  }

  return (req, res, next) => {
    switch (req.method) {
      case 'GET':
        // Return list of loggers
        res.json(LOGGER_LIST)
        break
      case 'PUT':
        let responseBody = []
        let hasErrors = false

        // If there is no request body, throw 400
        if (!req.body || !req.body.forEach) {
          console.warn('BunyanLoggerManager: No request body - If your request body was not empty, you are missing the bodyParser.json() middleware')
          res.status(400)
          res.end()
          return
        }

        // Loop through all logger updates
        req.body.forEach((loggerUpdate) => {
          const logLevel = loggerUpdate.level
          // Resolve logger
          let logger = (loggers || []).filter(logger => logger.fields.name === loggerUpdate.loggerName)[0]
          // Check the log level being set is valid
          let validLogLevel = validateLogLevel(logLevel)
          if (validLogLevel && logger) {
            // If valid, update log level, log the update to the logger itself at INFO level
            logger.level(logLevel)
            logger.info('Log level changed to ' + resolveLogLevel(logLevel))
            // Push the updated logger state into the response
            responseBody.push(Object.assign({}, loggerUpdate, {level: resolveLogLevel(logLevel)}))
          } else {
            // If there are errors, push them into 'errors' property on the response
            let errors = []
            if (!logger) errors.push('No logger with the name \'' + loggerUpdate.loggerName + '\' exists')
            if (!validLogLevel) errors.push('Invalid log level of \'' + loggerUpdate.level + '\' specified')
            responseBody.push(Object.assign({}, loggerUpdate, {
              level: resolveLogLevel(logger ? logger.level() : null),
              errors: errors
            }))
            hasErrors = true
          }
        })
        // Update the cached logger list to show the new levels
        LOGGER_LIST = getJsonListOfLoggers(loggers)
        // Send response
        res.status(hasErrors ? 400 : 200)
        res.json(responseBody)
        break
      default:
        next()
    }
  }
}

module.exports = middleware
