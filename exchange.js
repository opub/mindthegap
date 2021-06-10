const ccxt = require('ccxt');
const { reportExchange } = require('./report');
const loader = require('./loader');
const log = require('./logging');
const account = require('./account');
const socket = require('./socket');
const market = require('./market');

exports.loadMarkets = async function (reload) {
    log.debug('loadMarkets', !!reload);
    const jobs = [];

    let markets = loader.getAllMarkets();
    if (reload || markets.length === 0) {
        const latest = new Map();
        const balances = [];
        for (const name of ccxt.exchanges) {
            const exchange = loader.getExchange(name);
            if (exchange.include()) {
                const balance = await account.fetchBalance(exchange);
                if (balance) {
                    balance.id = name;
                    balances.push(balance);
                    exchange.balance = balance;
                }
                latest.set(name, exchange);
                jobs.push(market.loadMarket(exchange, reload));
            } else {
                log.debug(name, 'excluded');
            }
        }
        socket.notify('balances', balances);
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
}
