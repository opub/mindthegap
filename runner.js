'use strict';
const exchange = require('./exchange');
const market = require('./market');
const action = require('./action');
const log = require('./logging');
const config = require('config');
const server = require('./index');

const CONTINUOUS = config.get('continuous');
const RUNINTERVAL = config.get('runInterval');
let count = 0;

async function runner() {
    const started = Date.now();
    log.debug('started');

    const markets = await exchange.loadMarkets(count % config.get('reloadRate') === 0);
    let spreads = await market.getSpreads(markets);
    spreads = await action.process(spreads);
    server.notify('spreads', spreads);

    log.info('completed', ++count, ((Date.now() - started) / 1000).toFixed(3));

    if(CONTINUOUS) {
        setTimeout(runner, RUNINTERVAL);
    }
}

runner();