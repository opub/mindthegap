const { getExchange } = require('./exchange');
const action = require('./action');
const log = require('./logging');
const config = require('config');
const {round} = require('./utils');

exports.getSpreads = async function (markets) {
    log.debug('getting spreads');
    const jobs = [];

    for (const m of markets) {
        jobs.push(fetchMarketPrices(m));
    }
    let loaded = [];
    await Promise.allSettled(jobs).then((results) => {
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
                loaded = loaded.concat(result.value);
            }
        }
    });
    report(loaded);

    const filtered = filterSpreads(loaded);
    log.debug(filtered);
    return filtered;
};

function report(prices) {
    if(log.willLog('debug')) {
        let results = new Map();
    
        for(const p of prices) {
            let values = results.has(p.symbol) ? results.get(p.symbol) : { exchanges: [], bids: [], asks: [], makers: [], takers: [] };
            values.exchanges.push(p.exchange);            
            values.bids.push(p.bid);
            values.asks.push(p.ask);
            values.makers.push(p.maker);
            values.takers.push(p.taker);
            results.set(p.symbol, values);
        }

        log.debug(results);
    }
}

async function fetchMarketPrices(marketSet) {
    return new Promise(async (resolve, reject) => {
        let prices = [];
        const exchange = getExchange(marketSet.id);
        for (const m of marketSet.markets) {
            try {
                let orderbook = await exchange.fetchOrderBook(m.symbol);
                let bid = orderbook && orderbook.bids && orderbook.bids.length ? orderbook.bids[0][0] : undefined;
                let ask = orderbook && orderbook.asks && orderbook.asks.length ? orderbook.asks[0][0] : undefined;
                if(bid && ask) {
                    log.debug(exchange.id, m.symbol, 'loaded market price');
                    prices.push({ time: Date.now(), exchange: exchange.id, symbol: m.symbol, bid, ask, maker: m.maker, taker: m.taker, percentage: (m.percentage || m.percentage === undefined) });
                }
            }
            catch (e) {
                log.warn(marketSet.id, m.symbol, 'fetchMarketPrices failed', e.message.indexOf('\n') > 0 ? e.message.substring(0, e.message.indexOf('\n')) : e.message);
                log.error(e.stack);
            }
        }
        resolve(prices);
    });
}

function filterSpreads(data) {
    let prices = new Map();

    for (const item of data) {
        let symbol = item.symbol;
        let watched = action.getWatched(symbol);
        let shortable = !config.get('exchanges').shorts || config.get('exchanges').shorts.includes(item.exchange);
        let values = prices.has(symbol) ? prices.get(symbol) : { date: new Date(), symbol };

        // determine high and low bids for optimal spread unless already watching a combo
        if (!watched && (!values.low || item.bid < values.low.bid) || watched && watched.low.exchange === item.exchange) {
            values.low = item;
        }
        if (!watched && (!values.high || item.bid > values.high.bid) || watched && watched.high.exchange === item.exchange) {
            values.high = item;
        }
        if (!watched && shortable && (!values.short || item.bid > values.short.bid) || watched && watched.short.exchange === item.exchange) {
            values.short = item;
        }
        prices.set(symbol, values);
    }

    let results = [];
    for (const item of prices.values()) {
        item.spread = {};
        item.spreadPercent = {};
        let watching = action.watching(item.symbol);
        if (item.low && item.high && (watching || item.low.exchange !== item.high.exchange && item.high.bid)) {
            item.spread.best = getSpread(item.high, item.low);
            if(item.short) item.spread.short = getSpread(item.short, item.low);
            // spread percent factors in buying and selling fees to get more accurate profit percent
            item.spreadPercent.best = getSpreadPercent(item.spread.best, item.high, item.low);
            if(item.short) item.spreadPercent.short = getSpreadPercent(item.spread.short, item.short, item.low);
            if (watching || item.spreadPercent.best > 0 || item.spreadPercent.short > 0) {
                results.push(item);
            }
        }
    }
    results.sort(comparePrices);
    return results;
}

function getSpread(high, low) {
    let spread = high.bid - low.bid;
    if(!high.percentage) {
        spread -= Math.max(high.maker, high.taker) * 2;
    }
    if(!low.percentage) {
        spread -= Math.max(low.maker, low.taker) * 2;
    }
    return round(spread, 8)
}

function getSpreadPercent(spread, high, low) {
    let percent = spread / high.bid;
    if(high.percentage) {
        percent -= Math.max(high.maker, high.taker) * 2;
    }
    if(low.percentage) {
        percent -= Math.max(low.maker, low.taker) * 2;
    }
    return round(percent * 100.0, 8)
}

function comparePrices(a, b) {
    return b.spreadPercent.best - a.spreadPercent.best;
}
