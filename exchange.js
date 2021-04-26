const ccxt = require('ccxt');
const { filter } = require('./utils');
const { reportExchange } = require('./report');
const loader = require('./loader');
const log = require('./logging');
const config = require('config');
const account = require('./account');
const server = require('./index');
const market = require('./market');
require('./extensions');

exports.loadMarkets = async function (reload) {
    log.debug('loadMarkets', !!reload);
    const jobs = [];

    let markets = loader.getAllMarkets();
    if (reload || markets.length === 0) {
        const latest = new Map();
        const balances = [];
        for (const name of ccxt.exchanges) {
            const exchange = loader.getExchange(name);
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
        loader.setExchanges(latest);

        markets = [];
        await Promise.allSettled(jobs).then((results) => {
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    markets.push(result.value);
                }
            }
        });
        loader.setMarkets(markets);
        reportExchange(markets);
    }

    return markets;
};

function includeExchange(exchange) {
    return filter(exchange.id, config.exchanges)
        && (!config.exchanges.country || exchange.countries.includes(config.exchanges.country));
}