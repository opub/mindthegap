const { getExchange } = require('./exchange');
const action = require('./action');
const log = require('./logging');
const config = require('config');
const {round} = require('./utils');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

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

    return filterSpreads(loaded);
};

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
                    prices.push({ id: exchange.id, symbol: m.symbol, bid, ask, fee: Math.max(m.maker, m.taker), percentage: m.percentage });
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
        let watching = action.getWatched(symbol);
        let shortable = !config.get('exchanges').shorts || config.get('exchanges').shorts.includes(item.id);
        let values = prices.has(symbol) ? prices.get(symbol) : { date: new Date(), symbol, markets: [] };

        // determine high and low bids for optimal spread unless already watching a combo
        if (!watching && (!values.low || item.bid < values.low.bid) || watching && watched.low.id === item.id) {
            values.low = item;
        }
        if (!watching && (!values.high || item.bid > values.high.bid) || watching && watched.high.id === item.id) {
            values.high = item;
        }
        if (!watching && shortable && (!values.short || item.bid > values.short.bid) || watching && watched.short.id === item.id) {
            values.short = item;
        }
        values.markets.push(item);

        prices.set(symbol, values);
    }

    let results = [];
    for (const item of prices.values()) {
        item.spread = {};
        item.spreadPercent = {};
        let watching = action.watching(item.symbol);
        if (watching || item.low && item.high && item.low.id !== item.high.id && item.high.bid) {
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

exports.report = function (data) {
    saveResults(data);
    log.debug(JSON.stringify(data, null, 2));
}

function getSpread(high, low) {
    let spread = high.bid - low.bid;
    if(high.percentage === false) {
        spread -= high.fee * 2;
    }
    if(low.percentage === false) {
        spread -= low.fee * 2;
    }
    return round(spread, 8)
}

function getSpreadPercent(spread, high, low) {
    let percent = spread / high.bid;
    if(high.percentage !== false) {
        percent -= high.fee * 2;
    }
    if(low.percentage !== false) {
        percent -= low.fee * 2;
    }
    return round(percent * 100.0, 8)
}

function comparePrices(a, b) {
    return b.spreadPercent.best - a.spreadPercent.best;
}

async function saveResults(prices) {
    prices.forEach(item => {
        item.date = item.date.toISOString();
        getWriter(item.symbol).writeRecords([item]);
    });
}

const writerCache = new Map();

function getWriter(symbol) {
    let key = symbol.replace(/\W/g, '');
    if(writerCache.has(key)) {
        return writerCache.get(key);
    } else {
        const writer = createCsvWriter({
            append: true,
            path: config.get('output') + key + '.csv',
            header: [
                { id: 'date', title: 'Date' },
                { id: 'spreadPercent.best', title: 'Percent' },
                { id: 'spread.best', title: 'Spread' },
                { id: 'low.id', title: 'Low Exchange' },
                { id: 'high.id', title: 'High Exchange' },
                { id: 'low.bid', title: 'Low Bid' },
                { id: 'high.bid', title: 'High Bid' },
                { id: 'low.fee', title: 'Low Fee' },
                { id: 'high.fee', title: 'High Fee' },
                { id: 'symbol', title: 'Symbol' }
            ]
        });
        writerCache.set(key, writer);
        return writer;
    }
}