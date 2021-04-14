const ccxt = require('ccxt');
const log = require('./logging');

ccxt.binanceus.prototype.depositAddress = async function (currency) {
    let data = await this.wapiGetDepositAddress({ asset: currency });
    if (data && data.success) {
        return data.address;
    }
    return null;
}

async function createDepositAddress(currency) {
    try {
        let data = await this.createDepositAddress(currency);
        if (data && data.address) {
            return data.address;
        }
    }
    catch (e) {
        log.warn(this.id, 'createDepositAddress failed', currency, e);
    }
    return null;
}

async function fetchDepositAddress(currency) {
    try {
        let data = await this.fetchDepositAddress(currency);
        if (data && data.address) {
            return data.address;
        }
    }
    catch (e) {
        log.warn(this.id, 'fetchDepositAddress failed', currency, e);
    }
    return null;
}

ccxt.bitstamp.prototype.depositAddress = fetchDepositAddress;
ccxt.bittrex.prototype.depositAddress = fetchDepositAddress;
ccxt.coinbasepro.prototype.depositAddress = createDepositAddress;
ccxt.gemini.prototype.depositAddress = createDepositAddress;
ccxt.kraken.prototype.depositAddress = fetchDepositAddress;
ccxt.okcoin.prototype.depositAddress = fetchDepositAddress;
