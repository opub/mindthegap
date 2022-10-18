const config = require('config');
const log = require('../logging');
const { filter } = require('../utils');

async function simplifyDepositAddress(target, currency) {
    const id = target.id;
    try {
        let data;
        if (['bitstamp', 'bittrex', 'kraken', 'okcoin'].includes(id)) {
            data = await target.fetchDepositAddress(currency);
        } else if (['coinbasepro', 'gemini'].includes(id)) {
            data = await target.createDepositAddress(currency);
        } else if (id === 'binanceus') {
            data = await target.wapiGetDepositAddress({ asset: currency });
        }
        if (data && (data.success || data.address)) {
            return data.address;
        }
    }
    catch (e) {
        log.warn(id, 'simplifyDepositAddress failed', currency, e);
    }
    return null;
}

const Wrapper = {
    get: function (target, prop) {

        if (prop === 'depositAddress') {
            return function() {
                return simplifyDepositAddress(target, arguments[0]);
            }
        }
        else if (prop === 'include') {
            return function () {
                return filter(target.id, config.exchanges) &&
                    (!config.exchanges.country || target.countries.includes(config.exchanges.country));
            };
        }

        return target[prop];
    }
}

exports.proxy = function (target) {
    return new Proxy(target, Wrapper);
}