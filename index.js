'use strict';
const ccxt = require('ccxt');
const { includeExchange, includeMarket, debug, info, warn } = require('./utils');
const { marketReport, priceRport } = require('./stats');

const exchangeCache = new Map();

(async function () {
    const started = Date.now();
    info('started');

    const markets = await loadMarkets();
    info(JSON.stringify(marketReport(markets), null, 2));

    const prices = await getMarketPrices(markets);
    info(JSON.stringify(priceRport(prices), null, 2));

    info('elapsed', ((Date.now() - started) / 1000).toFixed(3));
    info('completed');
})();

async function getMarketPrices(markets) {
    info('getting market pricess');
    const jobs = [];

    for (const m of markets) {
        jobs.push(getMarketPrice(m));
    }

    let loaded = [];
    await Promise.allSettled(jobs).then((results) => {
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
                loaded = loaded.concat(result.value);
            }
        }
    });
    return loaded;
}

async function getMarketPrice(marketSet) {
    return new Promise(async (resolve, reject) => {
        let prices = [];
        const exchange = exchangeCache.get(marketSet.id);
        for (const m of marketSet.markets) {
            try {
                let orderbook = await exchange.fetchOrderBook(m.symbol);
                let bid = orderbook.bids.length ? orderbook.bids[0][0] : undefined;
                let ask = orderbook.asks.length ? orderbook.asks[0][0] : undefined;
                let spread = (bid && ask) ? ask - bid : undefined;
                debug(exchange.id, m.symbol, 'loaded market price');
                prices.push({ id: exchange.id, symbol: m.symbol, bid, ask, spread });
            }
            catch (e) {
                warn(marketSet.id, 'failed', e.message.indexOf('\n') > 0 ? e.message.substring(0, e.message.indexOf('\n')) : e.message);
            }
        }
        resolve(prices);
    });
}

async function loadMarkets() {
    info('loading markets');
    const jobs = [];

    for (const name of ccxt.exchanges) {
        const exchange = new ccxt[name]({ rateLimit: 1000, enableRateLimit: true });
        if (includeExchange(exchange)) {
            exchangeCache.set(name, exchange);
            jobs.push(loadMarket(exchange));
        } else {
            debug(name, 'excluded');
        }
    }

    const loaded = [];
    await Promise.allSettled(jobs).then((results) => {
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
                loaded.push(result.value);
            }
        }
    });
    return loaded;
}

async function loadMarket(exchange) {
    return new Promise(async (resolve, reject) => {
        try {
            const markets = await exchange.loadMarkets();
            const filtered = filterMarkets(markets);
            if (filtered.length > 0) {
                filtered.sort(compareMarkets);
                debug(exchange.id, 'loaded');
                resolve({
                    id: exchange.id,
                    markets: filtered
                });
            } else {
                debug(exchange.id, 'empty');
                resolve();
            }
        }
        catch (e) {
            warn(exchange.id, 'failed', e.message.indexOf('\n') > 0 ? e.message.substring(0, e.message.indexOf('\n')) : e.message);
            reject(e);
        }
    });
}

function compareMarkets(a, b) {
    return a.id.localeCompare(b.id);
}

function filterMarkets(markets) {
    const filtered = [];
    for (const value of Object.values(markets)) {
        if (includeMarket(value)) {
            filtered.push(value);
        }
    }
    return filtered;
}
