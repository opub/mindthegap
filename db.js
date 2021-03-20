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
    stmts.deleteWatching = db.prepare('DELETE FROM watching');
    stmts.insertWatching = db.prepare('INSERT INTO watching (time, symbol, data) VALUES (@time, @symbol, @data)');
    stmts.selectWatching = db.prepare('SELECT data FROM watching');
}

function teardown() {
    log.info('database teardown');
    db.close();
}

exports.saveSpreads = async function (spreads) {
    for (const row of spreads) {
        row.data = JSON.stringify(row);
        row.time = row.date.getTime();
        stmts.insertSpreads.run(row);
    }
};

exports.getSpreads = function (time) {
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

exports.saveWatching = async function (spreads) {
    const replace = db.transaction((rows) => {
        stmts.deleteWatching.run();
        for (const row of rows) {
            delete row.data;
            delete row.time;
            row.data = JSON.stringify(row);
            row.time = row.date.getTime();
            stmts.insertWatching.run(row);
        }
    });
    replace(spreads);
};

exports.getWatching = function () {
    const rows = stmts.selectWatching.all();
    const results = [];
    for (const row of rows) {
        let spread = JSON.parse(row.data);
        spread.date = new Date(spread.date);
        results.push(spread);
    }
    return results;
};

setup();
