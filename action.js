const log = require('./logging');
const config = require('config');
const db = require('./db');

const ARBITRAGE_THRESHOLD = config.get('arbitrageThreshold');
const OPEN_SHORT_THRESHOLD = config.get('openShortThreshold');
const CLOSE_SHORT_PROFIT = config.get('closeShortProfit');
const watchList = new Map();

exports.watching = function(symbol) {
    return watchList.has(symbol);
};

exports.getWatched = function(symbol) {
    return watchList.get(symbol);
};

exports.process = async function(spreads) {
    for(const spread of spreads) {
        let symbol = spread.symbol;
        if(!watchList.has(symbol)) {
            spread.duration = undefined;
            if(spread.spreadPercent.best >= ARBITRAGE_THRESHOLD) {
                log.info('ARBITRAGE', spread);
                spread.action = 'arbitrage';
            } else if(spread.spreadPercent.short >= OPEN_SHORT_THRESHOLD) {
                log.info('OPENING', spread);
                watchList.set(symbol, spread);
                spread.action = 'open';
            } else {
                log.info('passing on', symbol, spread.spreadPercent);
                spread.action = 'pass';
            }
        } 
        else {
            let previous = watchList.get(symbol);
            spread.duration = Date.now() - previous.date.getTime();
            if(spread.spreadPercent.short <= previous.spreadPercent.short - CLOSE_SHORT_PROFIT) {
                log.info('CLOSING', previous.spreadPercent.short, spread);
                watchList.delete(symbol);
                spread.action = 'close';
            } else {
                log.info('already watching', symbol, previous.spreadPercent.short, spread.spreadPercent.short);
                spread.action = 'watch';
            }
        }
    }
    db.insertSpreads(spreads);

    return spreads;
};