'use strict';
const exchange = require('./exchange');
const market = require('./market');
const log = require('./logging');

const CONTINUOUS = false;
const RUNINTERVAL = 30000;

async function runner() {
    const started = Date.now();
    log.info('started');

    const markets = await exchange.loadMarkets();
    log.info(JSON.stringify(exchange.report(markets), null, 2));

    const prices = await market.getPrices(markets);
    log.info(JSON.stringify(market.report(prices), null, 2));

    log.info('completed', ((Date.now() - started) / 1000).toFixed(3));

    if(CONTINUOUS) {
        setTimeout(runner, RUNINTERVAL);
    }
}

runner();