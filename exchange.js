const ccxt = require('ccxt');
const { includeExchange, includeMarket } = require('./utils');
const log = require('./logging');
const config = require('config');
const account = require('./account');
require('./extensions');

const RATELIMIT = config.get('rateLimit');
let exchangeCache = new Map();
let marketCache = [];

exports.getCurrentExchanges = function () {
    return exchangeCache;
}

function getExchange(name) {
    if (exchangeCache.has(name)) {
        return exchangeCache.get(name);
    } else {
        return new ccxt[name]({ rateLimit: RATELIMIT, enableRateLimit: true });
    }
};
exports.getExchange = getExchange;

exports.loadMarkets = async function (reload) {
    log.debug('loading markets');
    const jobs = [];

    if(reload || marketCache.length === 0) {
        const latest = new Map();
        for (const name of ccxt.exchanges) {
            const exchange = getExchange(name);
            if (includeExchange(exchange)) {
                const balance = await account.fetchBalance(exchange);
                if (balance) {
                    latest.set(name, exchange);
                    jobs.push(loadMarket(exchange, reload));
                }
            } else {
                log.debug(name, 'excluded');
            }
        }
        exchangeCache = latest;
        log.info('exchanges', [...exchangeCache.keys()]);

        marketCache = [];
        await Promise.allSettled(jobs).then((results) => {
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    marketCache.push(result.value);
                }
            }
        });
        report(marketCache);
    }

    return marketCache;
};

async function loadMarket(exchange, reload) {
    return new Promise(async (resolve, reject) => {
        try {
            const markets = await exchange.loadMarkets(reload);
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

function report(data) {
    if (log.willLog('debug')) {
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
}