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

exports.debug = function (...params) {
    if (willLog('debug')) {
        writeLog('debug', params);
    }
}

exports.info = function (...params) {
    if (willLog('info')) {
        writeLog('info', params);
    }
}

exports.warn = function (...params) {
    if (willLog('warn')) {
        writeLog('warn', params);
    }
}

exports.error = function (...params) {
    if (willLog('error')) {
        if (params && params.length > 0 && params[0] && params[0].stack && params[0].message) {
            let e = params[0];
            params = params.slice(1);
            params.push(e.message, e.stack);
        }
        writeLog('error', params);
    }
}

function writeLog(level, params) {
    if (level === 'error') {
        console.error(new Date().toISOString(), level.toUpperCase(), ...params);
    } else {
        console.log(new Date().toISOString(), level.toUpperCase(), ...params);
    }
}
