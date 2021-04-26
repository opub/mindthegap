const assert = require('assert');
const exchange = require('../exchange');

const MINIMUM = 5;
const NAME = 'kraken';

describe('exchange', function () {
    this.timeout(30000);

    describe('loadMarkets', function () {
        it('should load and return markets', async () => {
            const markets = await exchange.loadMarkets();
            assert(markets.length > MINIMUM);
        });
    });

    describe('getAllExchanges', function () {
        it('should return all exchanges', () => {
            const exchanges = exchange.getAllExchanges();
            assert(exchanges.size > MINIMUM);
            const ex = exchanges.get(NAME);
            assert.equal(ex.id, NAME);
        });
    });

    describe('getExchange', function () {
        it('should return one exchanges', () => {
            const ex = exchange.getExchange(NAME);
            assert.equal(ex.id, NAME);
        });
    });
});