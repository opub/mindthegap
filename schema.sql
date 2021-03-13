CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    exchange TEXT NOT NULL,
    bid REAL,
    ask REAL,
    maker REAL,
    taker REAL,
    percentage INTEGER
);

