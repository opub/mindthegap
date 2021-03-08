const ccxt = require('ccxt');
const { includeExchange, includeMarket } = require('./utils');
const log = require('./logging');
const config = require('config');

const RATELIMIT = config.get('rateLimit');
const exchangeCache = new Map();

exports.getExchange = function (id) {
    return exchangeCache.get(id);
};

exports.loadMarkets = async function () {
    log.debug('loading markets');
    const jobs = [];

    for (const name of ccxt.exchanges) {
        const exchange = new ccxt[name]({ rateLimit: RATELIMIT, enableRateLimit: true });
        if (includeExchange(exchange)) {
            exchangeCache.set(name, exchange);
            jobs.push(loadMarket(exchange));
        } else {
            log.debug(name, 'excluded');
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
};

async function loadMarket(exchange) {
    return new Promise(async (resolve, reject) => {
        try {
            const markets = await exchange.loadMarkets(true);
            const filtered = filterMarkets(markets);
            if (filtered.length > 0) {
                filtered.sort(compareMarkets);
                log.debug(exchange.id, 'loaded');
                resolve({
                    id: exchange.id,
                    markets: filtered
                });
            } else {
                log.debug(exchange.id, 'empty');
                resolve();
            }
        }
        catch (e) {
            let msg = e.toString();
            log.warn(exchange.id, 'loadMarket failed', msg.indexOf('\n') > 0 ? msg.substring(0, msg.indexOf('\n')) : msg);
            reject(e);
        }
    });
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

function compareMarkets(a, b) {
    return a.symbol.localeCompare(b.symbol);
}

exports.report = function (data) {
    let exchanges = new Set();
    let markets = new Set();
    let bases = new Set();
    let quotes = new Set();

    data.forEach(e => {
        exchanges.add(e.id);
        e.markets.forEach(m => {
            markets.add(m.symbol);
            bases.add(m.base);
            quotes.add(m.quote);
        });
    });

    let results = {
        exchanges: { count: exchanges.size, names: Array.from(exchanges.values()) },
        markets: { count: markets.size, names: Array.from(markets.values()) },
        bases: { count: bases.size, names: Array.from(bases.values()) },
        quotes: { count: quotes.size, names: Array.from(quotes.values()) }
    };

    log.debug(JSON.stringify(results, null, 2));
}