const log = require('./logging');

const OPEN_THRESHOLD = 2.5;
const CLOSE_THRESHOLD = 0.1;
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
                log.info('passing on', symbol);
            }
        } 
        else {
            if(spread.spreadPercent <= CLOSE_THRESHOLD) {
                log.info('CLOSING', spread);
                watchList.delete(symbol);
            } else {
                log.info('already watching', symbol);
            }
        }
    }
};