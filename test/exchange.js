const assert = require('assert');
const exchange = require('../exchange');

describe('exchange', function () {
    this.timeout(30000);

    describe('loadMarkets', function () {
        it('should return markets', async () => {
            const markets = await exchange.loadMarkets();
            assert(markets.length > 0);
        });
    });

});