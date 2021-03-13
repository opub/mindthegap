'use strict';
const exchange = require('./exchange');
const market = require('./market');
const action = require('./action');
const log = require('./logging');
const config = require('config');

const CONTINUOUS = config.get('continuous');
const RUNINTERVAL = config.get('runInterval');
let count = 0;

async function runner() {
    const started = Date.now();
    log.debug('started');

    const markets = await exchange.loadMarkets(count % config.get('reloadRate'));
    const spreads = await market.getSpreads(markets);
    await action.process(spreads);

    log.info('completed', ++count, ((Date.now() - started) / 1000).toFixed(3));

    if(CONTINUOUS) {
        setTimeout(runner, RUNINTERVAL);
    }
}

runner();