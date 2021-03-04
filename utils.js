const settings = require('./settings.json');

// filtering 

module.exports.includeExchange = function (exchange) {
    return filter(exchange.id, settings.exchanges)
        && (!settings.exchanges.country || exchange.countries.includes(settings.exchanges.country));
}

module.exports.includeMarket = function (market) {
    return market.active
        && filter(market.type ? market.type.toLowerCase() : market.type, settings.markets)
        && filter(market.base.toLowerCase(), settings.bases)
        && filter(market.quote.toLowerCase(), settings.quotes);
}

function filter(name, values) {
    return !(name && values && (values.include && !values.include.includes(name)
        || values.exclude && values.exclude.includes(name)));
}

// logging

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
