const fs = require('fs');
const log = require('./logging');
const db = require('better-sqlite3')('arbitrage.db');

function setup() {
    log.info('database setup');

    process.on('exit', () => db.close());

    const schema = fs.readFileSync('schema.sql', 'utf8');
    db.exec(schema);
}

setup();