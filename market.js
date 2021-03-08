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
                let bid = orderbook.bids.length ? orderbook.bids[0][0] : undefined;
                let ask = orderbook.asks.length ? orderbook.asks[0][0] : undefined;
                if(bid && ask) {
                    let spread =  ask - bid;
                    log.debug(exchange.id, m.symbol, 'loaded market price');
                    prices.push({ id: exchange.id, symbol: m.symbol, bid, ask, spread, fee: Math.max(m.maker, m.taker), percentage: m.percentage });
                }
            }
            catch (e) {
                log.warn(marketSet.id, m.symbol, 'fetchMarketPrices failed', e.message.indexOf('\n') > 0 ? e.message.substring(0, e.message.indexOf('\n')) : e.message);
            }
        }
        resolve(prices);
    });
}

function filterSpreads(data) {
    let prices = new Map();

    for (const item of data) {
        let values = prices.has(item.symbol) ? prices.get(item.symbol) : { date: new Date(), symbol: item.symbol, lowBid: Number.MAX_VALUE, highBid: 0, markets: [] };

        if (item.bid < values.lowBid) {
            values.lowBid = item.bid;
            values.lowExchange = item.id;
            values.lowFee = item.fee;
        }
        if (item.bid > values.highBid && (!config.get('exchanges').shorts || config.get('exchanges').shorts.includes(item.id))) {
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

const csvWriter = createCsvWriter({
    append: true,
    path: config.get('results'),
    header: [
        { id: 'date', title: 'Date' },
        { id: 'symbol', title: 'Symbol' },
        { id: 'spread', title: 'Spread' },
        { id: 'spreadPercent', title: 'Percent' },
        { id: 'lowExchange', title: 'Low Exchange' },
        { id: 'lowBid', title: 'Low Bid' },
        { id: 'lowFee', title: 'Low Fee' },
        { id: 'highExchange', title: 'High Exchange' },
        { id: 'highBid', title: 'High Bid' },
        { id: 'highFee', title: 'High Fee' }
    ]
});

async function saveResults(prices) {
    let data = prices;
    data.forEach(item => item.date = item.date.toISOString());
    return csvWriter.writeRecords(data);
}
