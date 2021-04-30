const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const socket = require('./socket');
const exchange = require('./exchange');
const market = require('./market');
const action = require('./action');
const db = require('./db');
const config = require('config');
const log = require('./logging');
const { execute } = require('./utils');

const port = process.env.PORT || 3000;
let count = 0;

function setup() {
    app.use(express.static('static'));

    app.route('/gaps/:time?').get(function (req, res) {
        log.info('GET /gaps/', req.params.time);
        const gaps = db.getGaps(req.params.time);
        res.send(gaps);
    });

    http.listen(port, () => {
        log.info(`server running at http://localhost:${port}/`);
    });

    socket.setup(http);

    runner();
}

async function runner() {
    const started = Date.now();
    log.debug('started');

    const reload = count % config.get('reloadRate') === 0;
    const markets = await exchange.loadMarkets(reload);
    let gaps = await market.getGaps(markets);
    gaps = await action.process(gaps);
    socket.notify('gaps', gaps);

    log.info('completed', ++count, ((Date.now() - started) / 1000).toFixed(3));

    if (config.get('continuous')) {
        setTimeout(runner, config.get('runInterval'));
    }
}

execute(setup);