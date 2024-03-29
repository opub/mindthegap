
/*

-- best in last week
select symbol, json_extract(data, '$.low.exchange'), json_extract(data, '$.high.exchange'), max(json_extract(data, '$.gapPercent.best'))
from gaps where action = 'arbitrage' and json_extract(data, '$.date') > date('now', '-7 days') group by 1, 2, 3 order by 4 desc, 1, 2, 3;

-- summary results
select symbol, action, 
json_extract(data, '$.low.exchange'), json_extract(data, '$.high.exchange'), 
json_extract(data, '$.short.exchange'), count(*) 
from gaps where not action in ('pass','watch') group by 1,2,3,4,5 order by 6 desc,2,1;


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
  gap: { best: 0.00189, short: 0.001809 },
  gapPercent: { best: 2.75016429, short: 2.38719026 }
*/
CREATE TABLE IF NOT EXISTS gaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    action TEXT,
    duration INTEGER,
    data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS watching (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    data TEXT NOT NULL
);
