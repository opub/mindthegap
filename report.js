const log = require('./logging');

exports.reportExchange = function (data) {
    if (log.willLog('debug')) {
        let exchanges = new Set();
        let markets = new Set();
        let bases = new Set();
        let quotes = new Set();

        data.forEach(e => {
            exchanges.add(e.id);
            e.markets.forEach(m => {
                markets.add(m.symbol);
                bases.add(m.base);
                quotes.add(m.quote);
            });
        });

        let results = {
            exchanges: { count: exchanges.size, names: Array.from(exchanges.values()) },
            markets: { count: markets.size, names: Array.from(markets.values()) },
            bases: { count: bases.size, names: Array.from(bases.values()) },
            quotes: { count: quotes.size, names: Array.from(quotes.values()) }
        };

        log.debug(JSON.stringify(results, null, 2));
    }
}