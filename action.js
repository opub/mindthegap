const log = require('./logging');
const config = require('config');

const OPEN_THRESHOLD = config.get('openThreshold');
const CLOSE_PROFIT = config.get('closeProfit');
const watchList = new Map();

exports.watching = function(item) {
    return watchList.has(item.symbol);
};

exports.process = async function(spreads) {
    for(const spread of spreads) {
        let symbol = spread.symbol;
        if(!watchList.has(symbol)) {
            if(spread.spreadPercent >= OPEN_THRESHOLD) {
                log.info('OPENING', spread);
                watchList.set(symbol, spread);
            } else {
                log.info('passing on', symbol, spread.spreadPercent);
            }
        } 
        else {
            let previous = watchList.get(symbol);
            if(spread.spreadPercent <= previous.spreadPercent - CLOSE_PROFIT) {
                log.info('CLOSING', previous.spreadPercent, spread);
                watchList.delete(symbol);
            } else {
                log.info('already watching', symbol, previous.spreadPercent, spread.spreadPercent);
            }
        }
    }
};