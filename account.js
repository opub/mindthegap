const credentials = require('./config/creds.json');
const log = require('./logging');

exports.fetchBalance = async function (exchange) {
    log.debug('fetching balance', exchange.id);
    if (exchange.has['fetchBalance'] && credentials[exchange.id]) {
        exchange = authenticate(exchange);
        const balance = await exchange.fetchBalance();
        log.debug(exchange.id, 'balance', balance.total);
        return balance.total;
    } else {
        log.debug(exchange.id, exchange.has['fetchBalance'] ? 'no credentials' : 'no fetchBalance support');
        return false;
    }
}

function authenticate(exchange) {
    const creds = credentials[exchange.id];
    for (const key of Object.keys(exchange.requiredCredentials)) {
        if (exchange.requiredCredentials[key]) {
            if (!creds[key]) {
                log.error('MISSING CREDENTIAL SETTING', exchange.id, key);
            } else {
                log.debug(exchange.id, 'setting credential', key);
                exchange[key] = creds[key];
            }
        }
    }
    return exchange;
}