/* eslint-env node, mocha */
var assert = require('assert')
var express = require('express')
var bunyan = require('bunyan')
var bunyanLoggerManager = require('../index.js')
var request = require('request')
var bodyParser = require('body-parser')

describe('When loggers are given, the logger', function () {
  before(function (done) {
    var logger1 = bunyan.createLogger({
      name: 'logger1',
      level: 'INFO'
    })

    var logger2 = bunyan.createLogger({
      name: 'logger2',
      level: 'FATAL'
    })

    this.logger1 = logger1
    this.logger2 = logger2

    this.app = express()
    this.app.use(bodyParser.json())
    this.app.use('/log-level', bunyanLoggerManager([logger1, logger2]))
    this.server = this.app.listen(3000, '0.0.0.0')
    done()
  })

  after(function (done) {
    this.server.close()
    done()
  })

  it('should return a list of the loggers which were given with the correct levels', function (done) {
    request.get('http://localhost:3000/log-level', (err, res, body) => {
      if (err) done(err)
      assert.deepEqual(JSON.parse(body), [
        { loggerName: 'logger1', level: 'INFO' },
        { loggerName: 'logger2', level: 'FATAL' }
      ])
      done()
    })
  })

  it('should update the log level when a PUT request is made', function (done) {
    const TARGET_LOG_LEVEL = 'DEBUG'
    const EQUIV_LOG_LEVEL = 20
    request({
      method: 'PUT',
      body: [{ loggerName: 'logger1', level: TARGET_LOG_LEVEL }],
      json: true,
      url: 'http://localhost:3000/log-level'
    }, (err, res, body) => {
      if (err) done(err)
      assert.equal(this.logger1.level(), EQUIV_LOG_LEVEL)
      assert.deepEqual(body, [{ loggerName: 'logger1', level: TARGET_LOG_LEVEL }])
      done()
    })
  })

  it('should reflect the updated log level when a GET request is made following the PUT', function (done) {
    request.get('http://localhost:3000/log-level', (err, res, body) => {
      if (err) done(err)
      assert.deepEqual(JSON.parse(body), [
        { loggerName: 'logger1', level: 'DEBUG' },
        { loggerName: 'logger2', level: 'FATAL' }
      ])
      done()
    })
  })

  it('should update the log level when a PUT request is made with an integer log level rather than a string', function (done) {
    const TARGET_LOG_LEVEL = 'WARN'
    const EQUIV_LOG_LEVEL = 40
    request({
      method: 'PUT',
      body: [{ loggerName: 'logger1', level: EQUIV_LOG_LEVEL }],
      json: true,
      url: 'http://localhost:3000/log-level'
    }, (err, res, body) => {
      if (err) done(err)
      assert.equal(this.logger1.level(), EQUIV_LOG_LEVEL)
      assert.deepEqual(body, [{ loggerName: 'logger1', level: TARGET_LOG_LEVEL }])
      done()
    })
  })

  it('should return an error when an invalid loggerName is given + statusCode of 400', function (done) {
    request({
      method: 'PUT',
      body: [{ loggerName: 'fakeLogger', level: 40 }],
      json: true,
      url: 'http://localhost:3000/log-level'
    }, (err, res, body) => {
      if (err) done(err)
      assert.equal(res.statusCode, 400)
      assert.deepEqual(body, [{ loggerName: 'fakeLogger', level: null, errors: ['No logger with the name \'fakeLogger\' exists'] }])
      done()
    })
  })

  it('should return an error when an invalid log level is given + statusCode of 400', function (done) {
    var invalidLogLevelString = new Promise((resolve, reject) => {
      request({
        method: 'PUT', body: [{ loggerName: 'logger1', level: 'UNICORNS' }], json: true, url: 'http://localhost:3000/log-level'
      }, (err, res, body) => {
        if (err) done(err)
        assert.equal(res.statusCode, 400)
        assert.deepEqual(body, [{ loggerName: 'logger1', level: 'WARN', errors: ['Invalid log level of \'UNICORNS\' specified'] }])
        resolve()
      })
    })

    var invalidLogLevelInt = new Promise((resolve, reject) => {
      request({
        method: 'PUT', body: [{ loggerName: 'logger1', level: 999 }], json: true, url: 'http://localhost:3000/log-level'
      }, (err, res, body) => {
        if (err) done(err)
        assert.equal(res.statusCode, 400)
        assert.deepEqual(body, [{ loggerName: 'logger1', level: 'WARN', errors: ['Invalid log level of \'999\' specified'] }])
        resolve()
      })
    })

    var noLoggerName = new Promise((resolve, reject) => {
      request({
        method: 'PUT', body: [{ level: 999 }], json: true, url: 'http://localhost:3000/log-level'
      }, (err, res, body) => {
        if (err) done(err)
        assert.equal(res.statusCode, 400)
        assert.deepEqual(body, [{ level: null, errors: [
          'No logger with the name \'undefined\' exists',
          'Invalid log level of \'999\' specified'
        ] }])
        resolve()
      })
    })

    Promise.all([invalidLogLevelString, invalidLogLevelInt, noLoggerName]).then(() => {
      done()
    })
  })

  it('should return error 400 when no request body is given', function (done) {
    request({
      method: 'PUT', body: null, url: 'http://localhost:3000/log-level'
    }, (err, res, body) => {
      if (err) done(err)
      assert.equal(res.statusCode, 400)
      done()
    })
  })
})

describe('When no loggers are given, the logger', function () {
  before(function (done) {
    this.app = express()
    this.app.use(bodyParser.json())
    this.app.use('/log-level', bunyanLoggerManager())
    this.server = this.app.listen(3000, '0.0.0.0')
    done()
  })

  after(function (done) {
    this.server.close()
    done()
  })

  it('should return an empty list on GET due to there being no loggers', function (done) {
    request.get('http://localhost:3000/log-level', (err, res, body) => {
      if (err) done(err)
      assert.deepEqual(JSON.parse(body), [])
      done()
    })
  })

  it('should return status 400 with the appropriate errors when a PUT request is made', function (done) {
    const TARGET_LOG_LEVEL = 'WARN'
    request({
      method: 'PUT',
      body: [{ loggerName: 'logger1', level: TARGET_LOG_LEVEL }],
      json: true,
      url: 'http://localhost:3000/log-level'
    }, (err, res, body) => {
      if (err) done(err)
      assert.equal(res.statusCode, 400)
      assert.deepEqual(body, [{ loggerName: 'logger1', level: null, errors: ['No logger with the name \'logger1\' exists'] }])
      done()
    })
  })
})

describe('When bodyParser is not set up as middleware', function () {
  before(function (done) {
    this.app = express()
    this.app.use('/log-level', bunyanLoggerManager())
    this.server = this.app.listen(3000, '0.0.0.0')
    done()
  })

  after(function (done) {
    this.server.close()
    done()
  })

  it('should throw an error prompting the user to install bodyParser', function (done) {
    request.get('http://localhost:3000/log-level', (err, res, body) => {
      if (err) done(err)
      assert.deepEqual(JSON.parse(body), [])
      done()
    })
  })

})
