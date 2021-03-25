let config = require('config').get('logging');

const levels = {
    none: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4
};

exports.setLevel = function (level) {
    config = level;
}

function willLog(level) {
    return !config || levels[level] <= levels[config];
}
exports.willLog = willLog;

exports.debug = function () {
    if (willLog('debug')) {
        writeLog('debug', arguments);
    }
}

exports.info = function () {
    if (willLog('info')) {
        writeLog('info', arguments);
    }
}

exports.warn = function () {
    if (willLog('warn')) {
        writeLog('warn', arguments);
    }
}

exports.error = function () {
    if (willLog('error')) {
        writeLog('error', arguments);
    }
}

function writeLog(level, params) {
    if(level === 'error') {
        console.error(new Date().toISOString(), level.toUpperCase(), ...params);
    } else {
        console.log(new Date().toISOString(), level.toUpperCase(), ...params);
    }
}
