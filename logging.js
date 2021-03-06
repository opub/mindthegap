const config = require('config').get('logging');

exports.debug = function () {
    if (config === 'debug') {
        writeLog('debug', arguments);
    }
}

exports.info = function () {
    if (config === 'debug' || config === 'info') {
        writeLog('info', arguments);
    }
}

exports.warn = function () {
    if (!config || config === 'debug' || config === 'info' || config === 'warn') {
        writeLog('warn', arguments);
    }
}

exports.error = function () {
    writeLog('error', arguments);
}

function writeLog(level, params) {
    if (!config || config === 'debug' || (config === 'info' && level !== 'debug')
        || (config === level)) {
        console.log(new Date().toISOString(), level.toUpperCase(), ...params);
    }
}
