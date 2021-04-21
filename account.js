const credentials = require('./config/creds.json');
const log = require('./logging');

exports.fetchBalance = async function (exchange) {
    const name = exchange.id;
    log.debug(name, 'fetching balance');
    if (exchange.has['fetchBalance'] && credentials[name]) {
        try {
            exchange = authenticate(exchange);
            const params = {};
            if (name === 'okcoin') {
                params.type = 'account';
            }
            const balance = await exchange.fetchBalance(params);
            const total = prune(balance.total);
            if(total) {
                log.debug(name, 'balance', total);
                return total;
            }
        }
        catch (e) {
            let msg = e.toString();
            log.warn(exchange.id, 'fetchBalance failed', msg.indexOf('\n') > 0 ? msg.substring(0, msg.indexOf('\n')) : msg);
        }
    } else {
        log.debug(name, exchange.has['fetchBalance'] ? 'no credentials' : 'no fetchBalance support');
    }
    return false;
}

exports.getDepositAddress = async function (exchange, currency) {
    if (!exchange.depositAddress) {
        log.error(exchange.id, 'depositAddress NOT SUPPORTED');
    } else {
        return exchange.depositAddress(currency);
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
exports.authenticate = authenticate;

function prune(total) {
    let exist = false;
    let balances = {};
    for (const key of Object.keys(total)) {
        if (total[key]) {
            balances[key] = total[key];
            exist = true;
        }
    }
    return exist ? balances : false;
}