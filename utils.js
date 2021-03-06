const config = require('config');

// filtering 

exports.includeExchange = function (exchange) {
    return filter(exchange.id, config.exchanges)
        && (!config.exchanges.country || exchange.countries.includes(config.exchanges.country));
}

exports.includeMarket = function (market) {
    return market.active && !market.darkpool
        && filter(market.type ? market.type.toLowerCase() : market.type, config.markets)
        && filter(market.base.toLowerCase(), config.bases)
        && filter(market.quote.toLowerCase(), config.quotes);
}

function filter(name, values) {
    return !(name && values && (values.include && !values.include.includes(name)
        || values.exclude && values.exclude.includes(name)));
}
