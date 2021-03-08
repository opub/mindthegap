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
        let watching = action.watching(item);
        let watched = watching ? action.getWatched(item) : undefined;
        let shortable = !config.get('exchanges').shorts || config.get('exchanges').shorts.includes(item.id);
        let values = prices.has(item.symbol) ? prices.get(item.symbol) : { date: new Date(), symbol: item.symbol, lowBid: Number.MAX_VALUE, highBid: 0, markets: [] };

        // determine high and low bids for optimal spread unless already watching a combo
        if (!watching && item.bid < values.lowBid || watching && watched.lowExchange === item.id) {
            values.lowBid = item.bid;
            values.lowExchange = item.id;
            values.lowFee = item.fee;
        }
        if (!watching && shortable && item.bid > values.highBid  || watching && watched.highExchange === item.id) {
            values.highBid = item.bid;
            values.highExchange = item.id;
            values.highFee = item.fee;
        }
        values.markets.push(item);

        prices.set(item.symbol, values);
    }

    let results = [];
    for (const item of prices.values()) {
        let watching = action.watching(item);
        if (watching || item.lowExchange !== item.highExchange && item.highBid > 0) {
            item.spread = round(item.highBid - item.lowBid, 8);
            // spread percent factors in buying and selling fees to get more accurate profit percent
            item.spreadPercent = round((item.spread / item.highBid - (item.lowFee * 2) - (item.highFee * 2)) * 100.0, 8);
            if (watching || item.spreadPercent > 0) {
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

function comparePrices(a, b) {
    return b.spreadPercent - a.spreadPercent;
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
                { id: 'spreadPercent', title: 'Percent' },
                { id: 'spread', title: 'Spread' },
                { id: 'lowExchange', title: 'Low Exchange' },
                { id: 'highExchange', title: 'High Exchange' },
                { id: 'lowBid', title: 'Low Bid' },
                { id: 'highBid', title: 'High Bid' },
                { id: 'lowFee', title: 'Low Fee' },
                { id: 'highFee', title: 'High Fee' },
                { id: 'symbol', title: 'Symbol' }
            ]
        });
        writerCache.set(key, writer);
        return writer;
    }
}