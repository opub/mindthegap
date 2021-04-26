const action = require('./action');
const log = require('./logging');
const config = require('config');
const { filter, round } = require('./utils');
const { reportMarkets } = require('./report');

let marketCache = [];

function getAllMarkets() {
    log.debug('getAllMarkets');
    return marketCache;
}
exports.getAllMarkets = getAllMarkets;

function setAllMarkets(latest) {
    log.debug('setAllMarkets');
    marketCache = latest;
}
exports.setAllMarkets = setAllMarkets;

async function loadMarket(exchange, reload) {
    return new Promise(async (resolve, reject) => {
        try {
            const markets = await exchange.loadMarkets(reload);
            const filtered = filterMarkets(markets);
            if (filtered.length > 0) {
                filtered.sort(compareMarkets);
                log.debug(exchange.id, 'loaded');
                resolve({
                    id: exchange.id,
                    markets: filtered
                });
            } else {
                log.debug(exchange.id, 'empty');
                resolve();
            }
        }
        catch (e) {
            let msg = e.toString();
            log.warn(exchange.id, 'loadMarket failed', msg.indexOf('\n') > 0 ? msg.substring(0, msg.indexOf('\n')) : msg);
            reject(e);
        }
    });
}
exports.loadMarket = loadMarket;

function filterMarkets(markets) {
    const filtered = [];
    for (const value of Object.values(markets)) {
        if (includeMarket(value)) {
            filtered.push(value);
        }
    }
    return filtered;
}

function includeMarket(market) {
    return market.active && !market.darkpool
        && filter(market.type ? market.type.toLowerCase() : market.type, config.markets)
        && filter(market.base.toLowerCase(), config.bases)
        && filter(market.quote.toLowerCase(), config.quotes);
}

function compareMarkets(a, b) {
    return a.symbol.localeCompare(b.symbol);
}

exports.getGaps = async function (markets) {
    log.debug('getting gaps');
    const jobs = [];

    for (const m of markets) {
        jobs.push(fetchMarketPrices(m));
    }
    let loaded = [];
    await Promise.allSettled(jobs).then((results) => {
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
                loaded = loaded.concat(result.value);
            }
        }
    });
    reportMarkets(loaded);

    const filtered = filterGaps(loaded);
    log.debug(filtered);
    return filtered;
};

async function fetchMarketPrices(marketSet) {
    return new Promise(async (resolve, reject) => {
        let prices = [];
        const exchange = getExchange(marketSet.id);
        for (const m of marketSet.markets) {
            try {
                let orderbook = await exchange.fetchOrderBook(m.symbol);
                let bid = orderbook && orderbook.bids && orderbook.bids.length ? orderbook.bids[0][0] : undefined;
                let ask = orderbook && orderbook.asks && orderbook.asks.length ? orderbook.asks[0][0] : undefined;
                if (bid && ask) {
                    log.debug(exchange.id, m.symbol, 'loaded market price');
                    prices.push({ time: Date.now(), exchange: exchange.id, symbol: m.symbol, bid, ask, maker: m.maker, taker: m.taker, percentage: (m.percentage || m.percentage === undefined) });
                }
            }
            catch (e) {
                log.warn(marketSet.id, m.symbol, 'fetchMarketPrices failed', e.message.indexOf('\n') > 0 ? e.message.substring(0, e.message.indexOf('\n')) : e.message);
                log.error(e.stack);
            }
        }
        resolve(prices);
    });
}

function filterGaps(data) {
    let prices = new Map();

    for (const item of data) {
        let symbol = item.symbol;
        let watched = action.getWatched(symbol);
        let shortable = !config.get('exchanges').shorts || config.get('exchanges').shorts.includes(item.exchange);
        let values = prices.has(symbol) ? prices.get(symbol) : { date: new Date(), symbol };

        // determine high and low bids for optimal gap unless already watching a combo
        if (!watched && (!values.low || item.bid < values.low.bid) || watched && watched.low.exchange === item.exchange) {
            values.low = item;
        }
        if (!watched && (!values.high || item.bid > values.high.bid) || watched && watched.high.exchange === item.exchange) {
            values.high = item;
        }
        if (!watched && shortable && (!values.short || item.bid > values.short.bid) || watched && watched.short.exchange === item.exchange) {
            values.short = item;
        }
        prices.set(symbol, values);
    }

    let results = [];
    for (const item of prices.values()) {
        item.gap = {};
        item.gapPercent = {};
        let watching = action.watching(item.symbol);
        if (item.low && item.high && (watching || item.low.exchange !== item.high.exchange && item.high.bid)) {
            item.gap.best = getGap(item.high, item.low);
            if (item.short) item.gap.short = getGap(item.short, item.low);
            // gap percent factors in buying and selling fees to get more accurate profit percent
            item.gapPercent.best = getGapPercent(item.gap.best, item.high, item.low);
            if (item.short) item.gapPercent.short = getGapPercent(item.gap.short, item.short, item.low);
            if (watching || item.gapPercent.best > 0 || item.gapPercent.short > 0) {
                results.push(item);
            }
        }
    }
    results.sort(comparePrices);
    return results;
}

function getGap(high, low) {
    let gap = high.bid - low.bid;
    if (!high.percentage) {
        gap -= Math.max(high.maker, high.taker) * 2;
    }
    if (!low.percentage) {
        gap -= Math.max(low.maker, low.taker) * 2;
    }
    return round(gap, 8)
}

function getGapPercent(gap, high, low) {
    let percent = gap / high.bid;
    if (high.percentage) {
        percent -= Math.max(high.maker, high.taker) * 2;
    }
    if (low.percentage) {
        percent -= Math.max(low.maker, low.taker) * 2;
    }
    return round(percent * 100.0, 8)
}

function comparePrices(a, b) {
    return b.gapPercent.best - a.gapPercent.best;
}
