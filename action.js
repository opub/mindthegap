const log = require('./logging');
const config = require('config');
const db = require('./db');
const account = require('./account');
const loader = require('./loader');
const { execute } = require('./utils');

const ARBITRAGE_THRESHOLD = config.get('arbitrageThreshold');
const OPEN_SHORT_THRESHOLD = config.get('openShortThreshold');
const CLOSE_SHORT_PROFIT = config.get('closeShortProfit');
const ABANDON_THRESHOLD = config.get('abandonThreshold');
const CAN_ARBITRAGE = config.get('arbitrage');
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

async function transfer(source, destination, currency, amount) {
    try {
        const address = await account.getDepositAddress(destination, currency);
        log.info('transfer', amount, currency, address);
        if (address) {
            const results = await source.withdraw(currency, amount, address, false, params = { fee: "0.001", trade_pwd: source.trade_pwd });
            log.info('transfer', results);
        }
    }
    catch (e) {
        log.error(e, 'transfer failed', source.id, destination.id, currency);
    }
}
exports.transfer = transfer;

function canArbitrage(gap) {
    return (CAN_ARBITRAGE && gap.gapPercent.best >= ARBITRAGE_THRESHOLD
        && account.canBuy(loader.getExchange(gap.high.exchange), gap.symbol) && canTrade(gap.high.exchange, gap.symbol)
        && account.canSell(loader.getExchange(gap.low.exchange), gap.symbol)) && canTrade(gap.low.exchange, gap.symbol);
}

function canOpen(gap) {
    return (gap.gapPercent.short >= OPEN_SHORT_THRESHOLD
        && account.canOpenHigh(loader.getExchange(gap.short.exchange), gap.symbol) && canTrade(gap.short.exchange, gap.symbol)
        && account.canOpenLow(loader.getExchange(gap.low.exchange), gap.symbol)) && canTrade(gap.low.exchange, gap.symbol);
}

function canClose(gap, previous) {
    return gap.gapPercent.short <= previous.gapPercent.short - CLOSE_SHORT_PROFIT
        || gap.gapPercent.best >= ABANDON_THRESHOLD;
}

function canTrade(exchange, currency) {
    return !(config.exclusions && config.exclusions[exchange] && config.exclusions[exchange].includes(currency));
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