const settings = require('./settings.json');

module.exports.includeExchange = function (name) {
    return filter(name, settings.exchanges);
}

module.exports.includeMarket = function (market) {
    return market.active && filter(market.base.toLowerCase(), settings.bases) && filter(market.quote.toLowerCase(), settings.quotes);
}

module.exports.debug = function () {
    if (settings.logging === 'debug') {
        writeLog('debug', arguments);
    }
}

module.exports.info = function () {
    if (settings.logging === 'debug' || settings.logging === 'info') {
        writeLog('info', arguments);
    }
}

module.exports.warn = function () {
    if (!settings.logging || settings.logging === 'debug' || settings.logging === 'info' || settings.logging === 'warn') {
        writeLog('warn', arguments);
    }
}

module.exports.error = function () {
    writeLog('error', arguments);
}

function writeLog(level, params) {
    if (!settings.logging || settings.logging === 'debug' || (settings.logging === 'info' && level !== 'debug')
        || (settings.logging === level)) {
        console.log(new Date().toISOString(), level.toUpperCase(), ...params);
    }
}

function filter(name, values) {
    return !(values && (values.include && !values.include.includes(name)
        || values.exclude && values.exclude.includes(name)));
}