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
    exchange.report(markets);

    const spreads = await market.getSpreads(markets);
    market.report(spreads);

    log.info('completed', ((Date.now() - started) / 1000).toFixed(3));

    if(CONTINUOUS) {
        setTimeout(runner, RUNINTERVAL);
    }
}

runner();