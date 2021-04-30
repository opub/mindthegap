const credentials = require('./config/creds.json');
const log = require('./logging');
const socket = require('./socket');

let accountCache = new Map();

function get(name) {
    if (accountCache.has(name)) {
        return accountCache.get(name);
    } else {
        return { balance: {}, addresses: {} };
    }
};

function set(name, account) {
    accountCache.set(name, account);
}

function canBuy(exchange, symbol) {
    const market = exchange.markets[symbol];
    if (market && market.active) {
        const acct = get(exchange.id);
        if (acct.balance[market.quote] > 0) {
            return true;
        } else {
            log.warn(exchange.id, market.quote, 'NO BALANCE');
            socket.notify('alerts', [{ message: 'no balance', id: exchange.id, currency: market.quote }]);
        }
    }
    return false;
}
exports.canBuy = canBuy;

exports.canSell = function (exchange, symbol) {
    const market = exchange.markets[symbol];
    if (market && market.active) {
        const address = getAddress(exchange, market.base);
        if (address) {
            return true;
        } else {
            log.warn(exchange.id, market.base, 'NO DEPOSIT ADDRESS');
            socket.notify('alerts', [{ message: 'no deposit address', id: exchange.id, currency: market.quote }]);
        }
    }
    return false;
}

exports.canOpenHigh = function (exchange, symbol) {
    return canBuy(exchange, symbol);
}

exports.canOpenLow = function (exchange, symbol) {
    return canBuy(exchange, symbol);
}

exports.fetchBalance = async function (exchange) {
    const id = exchange.id;
    log.debug('fetchBalance', id);
    if (exchange.has['fetchBalance'] && credentials[id]) {
        try {
            exchange = authenticate(exchange);
            const params = {};
            if (id === 'okcoin') {
                params.type = 'account';
            }
            const balance = await exchange.fetchBalance(params);
            const total = prune(balance.total);
            if (total) {
                log.debug(id, 'balance', total);
                const account = get(id);
                account.balance = total;
                set(id, account);
                return total;
            }
        }
        catch (e) {
            let msg = e.toString();
            log.warn(exchange.id, 'fetchBalance failed', msg.indexOf('\n') > 0 ? msg.substring(0, msg.indexOf('\n')) : msg);
        }
    } else {
        log.debug(id, exchange.has['fetchBalance'] ? 'no credentials' : 'no fetchBalance support');
    }
    return false;
}

async function getDepositAddress(exchange, currency) {
    if (!exchange.depositAddress) {
        log.error(exchange.id, 'depositAddress NOT SUPPORTED');
    } else {
        return exchange.depositAddress(currency);
    }
}
exports.getDepositAddress = getDepositAddress;

async function getAddress(exchange, currency) {
    const acct = get(exchange.id);
    let address = acct.addresses[currency];
    if (!address) {
        address = await getDepositAddress(exchange, currency);
        if (address) {
            acct.addresses[currency] = address;
            set(exchange.id, acct);
        }
    }
    return address;
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
    if (creds.trade_pwd) {
        exchange.trade_pwd = creds.trade_pwd;
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