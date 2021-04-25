const ccxt = require('ccxt');
const { filter } = require('./utils');
const log = require('./logging');
const config = require('config');
const account = require('./account');
const server = require('./index');
const market = require('./market');
require('./extensions');

const RATELIMIT = config.get('rateLimit');
let exchangeCache = new Map();

function getExchange(id) {
    log.debug('getExchange', id);
    if (exchangeCache.has(id)) {
        return exchangeCache.get(id);
    } else {
        return new ccxt[id]({ rateLimit: RATELIMIT, enableRateLimit: true });
    }
};
exports.getExchange = getExchange;

function getAllExchanges() {
    log.debug('getAllExchanges');
    return exchangeCache;
}
exports.getAllExchanges = getAllExchanges;

function setAllExchanges(latest) {
    log.debug('setAllExchanges');
    exchangeCache = latest;
    log.info('exchanges', [...exchangeCache.keys()]);
}
exports.setAllExchanges = setAllExchanges;

exports.loadMarkets = async function (reload) {
    log.debug('loadMarkets', !!reload);
    const jobs = [];

    let markets = market.getAllMarkets();
    if (reload || markets.length === 0) {
        const latest = new Map();
        const balances = [];
        for (const name of ccxt.exchanges) {
            const exchange = getExchange(name);
            if (includeExchange(exchange)) {
                const balance = await account.fetchBalance(exchange);
                if (balance) {
                    balance.id = name;
                    balances.push(balance);
                }
                latest.set(name, exchange);
                jobs.push(market.loadMarket(exchange, reload));
            } else {
                log.debug(name, 'excluded');
            }
        }
        server.notify('balances', balances);
        setAllExchanges(latest);

        markets = [];
        await Promise.allSettled(jobs).then((results) => {
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    markets.push(result.value);
                }
            }
        });
        market.setAllMarkets(markets);
        report(markets);
    }

    return markets;
};

function includeExchange(exchange) {
    return filter(exchange.id, config.exchanges)
        && (!config.exchanges.country || exchange.countries.includes(config.exchanges.country));
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