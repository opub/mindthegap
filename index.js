'use strict';
const ccxt = require('ccxt');
const { includeExchange, includeMarket, debug, info, warn } = require('./utils');

(async function () {
    // let kraken = new ccxt.kraken();
    // let bitfinex = new ccxt.bitfinex();
    // let huobipro = new ccxt.huobipro();
    // let okcoinusd = new ccxt.okcoinusd ({
    //     apiKey: 'YOUR_PUBLIC_API_KEY',
    //     secret: 'YOUR_SECRET_PRIVATE_KEY',
    // });

    // const exchangeId = 'binance'
    //     , exchangeClass = ccxt[exchangeId]
    //     , exchange = new exchangeClass ({
    //         'apiKey': 'YOUR_API_KEY',
    //         'secret': 'YOUR_SECRET',
    //         'timeout': 30000,
    //         'enableRateLimit': true,
    //     });

    const markets = await loadMarkets();
    markets.forEach(exchange => exchange.markets.forEach(m => info(exchange.id, m.id)));
    // info(JSON.stringify(markets, null, 2));

    // debug('\n\n===================== LOAD MARKETS bitfinex =====================\n\n');
    // debug(bitfinex.id, filterMarkets(await bitfinex.loadMarkets()));

    // debug('\n\n===================== LOAD MARKETS huobipro =====================\n\n');
    // debug(huobipro.id, filterMarkets(await huobipro.loadMarkets()));

    // debug('\n\n===================== FETCH ORDER BOOK =====================\n\n');
    // debug(kraken.id, await kraken.fetchOrderBook(kraken.symbols[0]));

    // debug('\n\n===================== FETCH TICKER =====================\n\n');
    // debug(bitfinex.id, await bitfinex.fetchTicker('BTC/USD'));

    // debug('\n\n===================== FETCH TRADES =====================\n\n');
    // debug(huobipro.id, await huobipro.fetchTrades('ETH/USDT'));

    // log (okcoinusd.id, await okcoinusd.fetchBalance ());

    // sell 1 BTC/USD for market price, sell a bitcoin for dollars immediately
    // log (okcoinusd.id, await okcoinusd.createMarketSellOrder ('BTC/USD', 1));

    // buy 1 BTC/USD for $2500, you pay $2500 and receive ฿1 when the order is closed
    // log (okcoinusd.id, await okcoinusd.createLimitBuyOrder ('BTC/USD', 1, 2500.00));

    // pass/redefine custom exchange-specific order params: type, amount, price or whatever
    // use a custom order type
    // bitfinex.createLimitSellOrder ('BTC/USD', 1, 10, { 'type': 'trailing-stop' });

})();

async function loadMarkets() {
    info('loading markets');
    let loaded = [];

    for (const ex of ccxt.exchanges) {
        try {
            if (includeExchange(ex)) {
                const exClient = new ccxt[ex]();
                const markets = await exClient.loadMarkets();
                const filtered = filterMarkets(markets);
                if (filtered.length > 0) {
                    filtered.sort(compareMarkets);
                    loaded.push({
                        id: ex,
                        markets: filtered
                    });
                    debug(ex, 'loaded');
                } else {
                    debug(ex, 'empty');
                }
            } else {
                debug(ex, 'excluded');
            }
        }
        catch (e) {
            warn(ex, 'failed', e.message.indexOf('\n') > 0 ? e.message.substring(0, e.message.indexOf('\n')) : e.message);
        }
    }
    return loaded;
}

function compareMarkets(a, b) {
    return a.id.localeCompare(b.id);
}

function filterMarkets(markets) {
    let filtered = [];
    for (const value of Object.values(markets)) {
        if (includeMarket(value)) {
            filtered.push(value);
        }
    }
    return filtered;
}
