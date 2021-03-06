const watchList = new Map();

exports.watching = function(item) {
    return watchList.has(item.symbol);
};