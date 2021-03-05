module.exports.marketReport = function (data) {
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

    return {
        exchanges: { count: exchanges.size, names: Array.from(exchanges.values()) },
        markets: { count: markets.size, names: Array.from(markets.values()) },
        bases: { count: bases.size, names: Array.from(bases.values()) },
        quotes: { count: quotes.size, names: Array.from(quotes.values()) }
    }
}

module.exports.priceRport = function (data) {
    let prices = new Map();

    for (const item of data) {
        let values = prices.has(item.symbol) ? prices.get(item.symbol) : { symbol: item.symbol, lowAsk: Number.MAX_VALUE, highBid: 0 };

        if (item.ask < values.lowAsk) {
            values.lowAsk = item.ask;
            values.lowExchange = item.id;
        }
        if (item.bid > values.highBid) {
            values.highBid = item.bid;
            values.highExchange = item.id;
        }

        prices.set(item.symbol, values);
    }

    let results = [];
    for (const item of prices.values()) {
        if (item.lowExchange !== item.highExchange) {
            item.spread = item.lowAsk - item.highBid;
            item.spreadPercent = item.spread / item.lowAsk * 100.0;
            results.push(item);
        }
    }
    results.sort(comparePrices);
    return results;
}

function comparePrices(a, b) {
    return a.spread - b.spread;
}