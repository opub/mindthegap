const fs = require('fs');
const log = require('./logging');
const db = require('better-sqlite3')('arbitrage.db');

const stmts = {};

function setup() {
    log.info('database setup');

    process.on('exit', () => teardown());
    process.on('SIGHUP', () => process.exit(128 + 1));
    process.on('SIGINT', () => process.exit(128 + 2));
    process.on('SIGTERM', () => process.exit(128 + 15));

    const schema = fs.readFileSync('schema.sql', 'utf8');
    db.exec(schema);

    stmts.insertPrice = db.prepare('INSERT INTO prices (time, symbol, exchange, bid, ask, maker, taker, percentage) VALUES (@time, @symbol, @exchange, @bid, @ask, @maker, @taker, @percentage)');
}

function teardown() {
    log.info('database teardown');
    db.close();
}

exports.insertPrices = async function (prices) {
    for(const row of prices) {
        row.percentage = row.percentage ? 1 : 0;
        stmts.insertPrice.run(row);
    }
};

setup();