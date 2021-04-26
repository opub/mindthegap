const log = require('./logging');
const config = require('config');
const db = require('./db');
const account = require('./account');
const exchange = require('./exchange');
const { execute } = require('./utils');

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

exports.process = async function (gaps) {
    for (const gap of gaps) {
        let symbol = gap.symbol;
        if (!watchList.has(symbol)) {
            gap.duration = undefined;
            if (canArbitrage(gap)) {
                log.info('ARBITRAGE', gap);
                gap.action = 'arbitrage';
            } else if (canOpen(gap)) {
                log.info('OPENING', gap);
                watchList.set(symbol, gap);
                gap.action = 'open';
            } else {
                log.info('passing on', symbol, gap.gapPercent);
                gap.action = 'pass';
            }
        } else {
            let previous = watchList.get(symbol);
            gap.duration = Date.now() - previous.date.getTime();
            if (canClose(gap, previous)) {
                log.info('CLOSING', previous.gapPercent.short, gap);
                watchList.delete(symbol);
                gap.action = 'close';
            } else {
                log.info('already watching', symbol, previous.gapPercent.short, gap.gapPercent.short);
                gap.action = 'watch';
            }
        }
    }
    db.saveGaps(gaps);
    db.saveWatching(watchList.values())

    return gaps;
};

function canArbitrage(gap) {
    return (gap.gapPercent.best >= ARBITRAGE_THRESHOLD
        && account.canBuy(exchange.getExchange(gap.high.exchange), gap.symbol)
        && account.canSell(exchange.getExchange(gap.low.exchange), gap.symbol));
}

function canOpen(gap) {
    return (gap.gapPercent.short >= OPEN_SHORT_THRESHOLD
        && account.canOpenHigh(exchange.getExchange(gap.short.exchange), gap.symbol)
        && account.canOpenLow(exchange.getExchange(gap.low.exchange), gap.symbol));
}

function canClose(gap, previous) {
    return gap.gapPercent.short <= previous.gapPercent.short - CLOSE_SHORT_PROFIT
        || gap.gapPercent.best >= ABANDON_THRESHOLD;
}

function initialize() {
    const gaps = db.getWatching();
    log.info('watching', gaps.length);
    for (const item of gaps) {
        log.info(item);
        watchList.set(item.symbol, item);
    }
}

execute(initialize);