# Mind The Gap - cryptocurrency arbitrage bot
This is in a working state for identifying gaps in exchange prices for various coins. It handles both straight market buy-transfer-sell aad also market-neutral arbitrage using short positions. 

However there were multiple limitations to actually executing the transactions:
* I'm based in the US where many exchanges are blocked (while not ideal this is handled in the code)
* Very few of the exchanges allow margin trades (while not ideal this is handled in the code)
* The potential tax implications of running this were complex (I'm no tax professional)
* The lists of supported operations from the exchange APIs were not reliable. e.g. they would report they fully supported X but after logging in you'd find out that withdrawing X was suspended indefinitely. (this was very frustrating when you can't rely on the exchange APIs and ended up turning me off the whole project)

It ultimately got to the point where these limitations outweighed the benefits. So I am no longer actively developing this.

Links:
* Advantages of Market-Neutral Arbitrage: https://github.com/butor/blackbird/issues/100
* CCXT: https://github.com/ccxt/ccxt/wiki/Manual
* CCXT Pro Manual: https://github.com/ccxt/ccxt/wiki/ccxt.pro.manual#overview
* Getting Started: https://medium.com/coinmonks/crypto-exchange-websocket-examples-using-ccxws-d49450bc6295
* Shorting Bitcoin https://distill.io/kb/guides/bitcoin-shorting/ and https://bravenewcoin.com/insights/dont-believe-in-bitcoin-here-are-5-ways-to-short-it

## Code References
* Exchange structure https://github.com/ccxt/ccxt/wiki/Manual#exchange-structure
* Market structure https://github.com/ccxt/ccxt/wiki/Manual#market-structure

## NOTES
For more advanced crypto asset investors who are comfortable trading on digital asset exchanges, there are several platforms that offer “physical” bitcoin short selling on margin. Poloniex, Kraken, GDAX, and Bitfinex are examples of popular exchanges that enable their users to short bitcoin.

Shorting bitcoin on cryptocurrency exchanges functions in the same way as shorting bitcoin using CFDs — with the key difference being that you receive your profits in BTC as opposed to USD.

If you are a retail investor and do not have an account with a broker that supports CME/CBOE bitcoin futures contracts, you can also easily short bitcoin using an online CFD broker such as eToro, AvaTrade or Plus500.

Perpetual swap exchanges:
BitMEX (May 2016)
ByBit (December 2018)
OKEx (December 2018)
Binance (September 2019)
FTX (October 2019)
Huobi (April 2020)
dYdX (May 2020)

Sample markets:
```
{
  limits: {
    amount: { min: 1, max: undefined },
    price: { min: 0.0005, max: undefined },
    cost: { min: undefined, max: undefined }
  },
  precision: { amount: 1, price: 0.0005 },
  tierBased: undefined,
  percentage: undefined,
  taker: 0.0003,
  maker: 0.0003,
  id: 'ETH-19MAR21-2080-C',
  symbol: 'ETH-19MAR21-2080-C',
  base: 'ETH',
  quote: 'USD',
  active: true,
  type: 'option',
  spot: false,
  future: false,
  option: true,
  info: {
    tick_size: 0.0005,
    taker_commission: 0.0003,
    strike: 2080,
    settlement_period: 'week',
    quote_currency: 'USD',
    option_type: 'call',
    min_trade_amount: 1,
    maker_commission: 0.0003,
    kind: 'option',
    is_active: true,
    instrument_name: 'ETH-19MAR21-2080-C',
    expiration_timestamp: 1616140800000,
    creation_timestamp: 1614240002000,
    contract_size: 1,
    block_trade_commission: 0.00015,
    base_currency: 'ETH'
  }
}

{
  limits: {
    amount: { min: 0.0001, max: undefined },
    price: { min: 1, max: undefined },
    cost: { min: undefined, max: undefined }
  },
  precision: { amount: 0.0001, price: 1 },
  tierBased: true,
  percentage: true,
  taker: 0.0007000000000000001,
  maker: 0.0002,
  tiers: {
    taker: [ [Array], [Array], [Array], [Array], [Array], [Array] ],
    maker: [ [Array], [Array], [Array], [Array], [Array], [Array] ]
  },
  id: 'BTC-MOVE-WK-0326',
  symbol: 'BTC-MOVE-WK-0326',
  base: 'BTC',
  quote: 'USD',
  baseId: 'BTC',
  quoteId: 'USD',
  type: 'future',
  future: true,
  spot: false,
  active: true,
  info: {
    ask: 5738,
    baseCurrency: null,
    bid: 5608,
    change1h: -0.009712166696097474,
    change24h: 0.005017921146953405,
    changeBod: -0.01734711757490801,
    enabled: true,
    highLeverageFeeExempt: false,
    last: 5586,
    minProvideSize: 0.0001,
    name: 'BTC-MOVE-WK-0326',
    postOnly: false,
    price: 5608,
    priceIncrement: 1,
    quoteCurrency: null,
    quoteVolume24h: 129787.5474,
    restricted: false,
    sizeIncrement: 0.0001,
    type: 'future',
    underlying: 'BTC',
    volumeUsd24h: 129787.5474
  }
}

{
  limits: {
    amount: { min: 5, max: undefined },
    price: { min: undefined, max: undefined },
    cost: { min: undefined, max: undefined }
  },
  precision: { amount: 1e-8, price: 0.0001 },
  tierBased: true,
  percentage: true,
  taker: 0.0015,
  maker: 0,
  tiers: {
    perpetual: { maker: [Array], taker: [Array] },
    spot: { taker: [Array], maker: [Array] }
  },
  id: '699',
  symbol: 'USDC/USD',
  base: 'USDC',
  quote: 'USD',
  baseId: 'USDC',
  quoteId: 'USD',
  type: 'spot',
  spot: true,
  swap: false,
  active: true,
  info: {
    id: '699',
    product_type: 'CurrencyPair',
    code: 'CASH',
    name: null,
    market_ask: '1.0001',
    market_bid: '1.0',
    indicator: null,
    currency: 'USD',
    currency_pair_code: 'USDCUSD',
    symbol: null,
    btc_minimum_withdraw: null,
    fiat_minimum_withdraw: null,
    pusher_channel: 'product_cash_usdcusd_699',
    taker_fee: '0.0004',
    maker_fee: '-0.0001',
    low_market_bid: '1.0',
    high_market_ask: '1.0001',
    volume_24h: '116676.668052',
    last_price_24h: '1.0',
    last_traded_price: '1.0',
    last_traded_quantity: '27.561676',
    average_price: '1.0',
    quoted_currency: 'USD',
    base_currency: 'USDC',
    tick_size: '0.0001',
    disabled: false,
    margin_enabled: false,
    cfd_enabled: false,
    perpetual_enabled: false,
    last_event_timestamp: '1614655878.828506321',
    timestamp: '1614655878.828506321',
    multiplier_up: '1.001',
    multiplier_down: '0.999',
    average_time_interval: 300,
    progressive_tier_eligible: false
  }
}
```
