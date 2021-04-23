const log = require('./logging');
const config = require('config');
const db = require('./db');
const account = require('./account');
const exchange = require('./exchange');

const ARBITRAGE_THRESHOLD = config.get('arbitrageThreshold');
const OPEN_SHORT_THRESHOLD = config.get('openShortThreshold');
const CLOSE_SHORT_PROFIT = config.get('closeShortProfit');
const ABANDON_THRESHOLD = config.get('abandonThreshold');
const watchList = new Map();

exports.watching = function (symbol) {
    return watchList.has(symbol);
};

exports.getWatched = function (symbol) {
    return watchList.get(symbol);
};

exports.process = async function (spreads) {
    for (const spread of spreads) {
        let symbol = spread.symbol;
        if (!watchList.has(symbol)) {
            spread.duration = undefined;
            if (canArbitrage(spread)) {
                log.info('ARBITRAGE', spread);
                spread.action = 'arbitrage';
            } else if (canOpen(spread)) {
                log.info('OPENING', spread);
                watchList.set(symbol, spread);
                spread.action = 'open';
            } else {
                log.info('passing on', symbol, spread.spreadPercent);
                spread.action = 'pass';
            }
        } else {
            let previous = watchList.get(symbol);
            spread.duration = Date.now() - previous.date.getTime();
            if (canClose(spread, previous)) {
                log.info('CLOSING', previous.spreadPercent.short, spread);
                watchList.delete(symbol);
                spread.action = 'close';
            } else {
                log.info('already watching', symbol, previous.spreadPercent.short, spread.spreadPercent.short);
                spread.action = 'watch';
            }
        }
    }
    db.saveSpreads(spreads);
    db.saveWatching(watchList.values())

    return spreads;
};

function canArbitrage(spread) {    
    return (spread.spreadPercent.best >= ARBITRAGE_THRESHOLD
        && account.canBuy(exchange.getExchange(spread.high.exchange), spread.symbol) 
        && account.canSell(exchange.getExchange(spread.low.exchange), spread.symbol));
}

function canOpen(spread) {
    return (spread.spreadPercent.short >= OPEN_SHORT_THRESHOLD
        && account.canOpenHigh(exchange.getExchange(spread.short.exchange), spread.symbol) 
        && account.canOpenLow(exchange.getExchange(spread.low.exchange), spread.symbol));
}

function canClose(spread, previous) {
    return spread.spreadPercent.short <= previous.spreadPercent.short - CLOSE_SHORT_PROFIT
        || spread.spreadPercent.best >= ABANDON_THRESHOLD;
}

function initialize() {
    const spreads = db.getWatching();
    log.info('watching', spreads.length);
    for (const item of spreads) {
        log.info(item);
        watchList.set(item.symbol, item);
    }
}

initialize();