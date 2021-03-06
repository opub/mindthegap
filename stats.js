const config = require('config').get('exchanges');

exports.marketReport = function (data) {
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

exports.priceRport = function (data) {
    let prices = new Map();

    for (const item of data) {
        let values = prices.has(item.symbol) ? prices.get(item.symbol) : { symbol: item.symbol, lowBid: Number.MAX_VALUE, highBid: 0 };

        if (item.bid < values.lowBid) {
            values.lowBid = item.bid;
            values.lowExchange = item.id;
            values.lowFee = item.fee;
        }
        if (item.bid > values.highBid && (!config.shorts || config.shorts.includes(item.id))) {
            values.highBid = item.bid;
            values.highExchange = item.id;
            values.highFee = item.fee;
        }

        prices.set(item.symbol, values);
    }

    let results = [];
    for (const item of prices.values()) {
        if (item.lowExchange !== item.highExchange && item.highBid > 0) {
            item.spread = item.highBid - item.lowBid;
            item.spreadPercent = (item.spread / item.highBid - item.lowFee - item.highFee) * 100.0;
            if (item.spreadPercent > 0) {
                results.push(item);
            }
        }
    }
    results.sort(comparePrices);
    return results;
}

function comparePrices(a, b) {
    return b.spreadPercent - a.spreadPercent;
}