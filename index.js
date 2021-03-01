'use strict';
const ccxt = require('ccxt');
const { includeExchange, includeMarket, debug, info, warn } = require('./utils');

(async function () {

    const markets = await loadMarkets();
    info(JSON.stringify(markets, null, 2));

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

    info('loaded markets', loaded.length);
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
