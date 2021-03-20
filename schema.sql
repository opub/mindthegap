
/*
  date: 2021-03-19T13:23:19.633Z,
  symbol: 'TRX/USD',
  low: {
    time: 1616160189507,
    exchange: 'btcalpha',
    symbol: 'TRX/USD',
    bid: 0.05289,
    ask: 0.0615,
    maker: 0.002,
    taker: 0.002,
    percentage: 1
  },
  high: {
    time: 1616160192390,
    exchange: 'okcoin',
    symbol: 'TRX/USD',
    bid: 0.05478,
    ask: 0.05482,
    maker: 0.001,
    taker: 0.0015,
    percentage: 1
  },
  short: {
    time: 1616160196677,
    exchange: 'kraken',
    symbol: 'TRX/USD',
    bid: 0.054699,
    ask: 0.054753,
    maker: 0.0016,
    taker: 0.0026,
    percentage: 1
  },
  spread: { best: 0.00189, short: 0.001809 },
  spreadPercent: { best: 2.75016429, short: 2.38719026 }
*/
CREATE TABLE IF NOT EXISTS spreads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    action TEXT,
    duration INTEGER,
    data TEXT NOT NULL
);
