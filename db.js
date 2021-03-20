const fs = require('fs');
const log = require('./logging');
const db = require('better-sqlite3')('arbitrage.db');

const FOUR_HOURS = 4 * 60 * 60 * 1000;
const stmts = {};

function setup() {
    log.info('database setup');

    process.on('exit', () => teardown());
    process.on('SIGHUP', () => process.exit(128 + 1));
    process.on('SIGINT', () => process.exit(128 + 2));
    process.on('SIGTERM', () => process.exit(128 + 15));

    const schema = fs.readFileSync('schema.sql', 'utf8');
    db.exec(schema);

    stmts.insertSpreads = db.prepare('INSERT INTO spreads (time, symbol, action, duration, data) VALUES (@time, @symbol, @action, @duration, @data)');
    stmts.selectSpreads = db.prepare('SELECT data FROM spreads WHERE time > ? ORDER BY time');
}

function teardown() {
    log.info('database teardown');
    db.close();
}

exports.insertSpreads = async function (spreads) {
    for (const row of spreads) {
        row.data = JSON.stringify(row);
        row.time = row.date.getTime();
        stmts.insertSpreads.run(row);
    }
};

exports.selectSpreads = function (time) {
    if (!time) {
        time = Date.now() - FOUR_HOURS;
    }
    const rows = stmts.selectSpreads.all(time);
    const results = [];
    for (const row of rows) {
        results.push(JSON.parse(row.data));
    }
    return results;
};

setup();
