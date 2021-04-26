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

exports.reportMarkets = function (prices) {
    if (log.willLog('debug')) {
        let results = new Map();

        for (const p of prices) {
            let values = results.has(p.symbol) ? results.get(p.symbol) : { exchanges: [], bids: [], asks: [], makers: [], takers: [] };
            values.exchanges.push(p.exchange);
            values.bids.push(p.bid);
            values.asks.push(p.ask);
            values.makers.push(p.maker);
            values.takers.push(p.taker);
            results.set(p.symbol, values);
        }

        log.debug(results);
    }
}