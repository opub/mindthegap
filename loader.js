const ccxt = require('ccxt');
const log = require('./logging');
const config = require('config');
const { proxy } = require('./model/exchange');

const RATELIMIT = config.get('rateLimit');
const VERBOSE = false;

let exchangeCache = new Map();
let marketCache = [];

function getExchange(id) {
    log.debug('getExchange', id);
    if (exchangeCache.has(id)) {
        return exchangeCache.get(id);
    } else {
        return proxy(new ccxt[id]({ rateLimit: RATELIMIT, enableRateLimit: true, verbose: VERBOSE }));
    }
};
exports.getExchange = getExchange;

function getAllExchanges() {
    log.debug('getAllExchanges');
    return exchangeCache;
}
exports.getAllExchanges = getAllExchanges;

function setExchanges(latest) {
    log.debug('setExchanges');
    exchangeCache = latest;
    log.info('exchanges', [...exchangeCache.keys()]);
}
exports.setExchanges = setExchanges;

function getAllMarkets() {
    log.debug('getAllMarkets');
    return marketCache;
}
exports.getAllMarkets = getAllMarkets;

function setMarkets(latest) {
    log.debug('setMarkets');
    marketCache = latest;
}
exports.setMarkets = setMarkets;