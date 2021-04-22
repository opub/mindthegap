let socket = io();
let charts = new Map();
let colors = {
    background: '#162027',
    foreground: '#ffffff',
    grid: '#555555',
    open: '#09812a',
    close: '#ef5b5b',
    arbitrage: '#008bf8',
    best: '#66f4b4',
    short: '#85caff',
    bestTop: '#0AF68B',
    shortTop: '#3DABFF'
};

window.onload = function () {
    initialize();
};

function initialize() {
    let request = new XMLHttpRequest();
    request.open('GET', '/spreads');
    request.responseType = 'json';
    request.send();

    request.onload = function () {
        let spreads = request.response;
        if (spreads && spreads.length > 0) {
            for (let item of spreads) {
                addItem(item);
            }
        }
    }
}

socket.on('spreads', function (data) {
    for (let item of data) {
        addItem(item);
    }
});

socket.on('alerts', function (data) {
    let parent = document.getElementById('alertdata');
    for (let item of data) {
        let target = document.createElement('div');
        let id = item.id;
        delete item.id;
        target.innerText = id + ': ' + JSON.stringify(item);
        parent.appendChild(target);
    }
});

socket.on('balances', function (data) {
    let parent = document.getElementById('balancedata');
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
    for (let item of data) {
        let target = document.createElement('div');
        let id = item.id;
        delete item.id;
        target.innerText = id + ': ' + JSON.stringify(item);
        parent.appendChild(target);
    }
});

function addItem(item) {
    let chart = getChart(item.symbol);
    let time = new Date(item.date).getTime();

    chart.appendData([{
        data: [[time, item.spreadPercent.best]]
    }, {
        data: [[time, item.spreadPercent.short]]
    }]);

    if (item.action === 'open' || item.action === 'close') {
        const point = getAnnotation(item.action, item.short.exchange, item.low.exchange, time, item.spreadPercent.short);
        chart.addPointAnnotation(point);
    } else if (item.action === 'arbitrage') {
        const point = getAnnotation(item.action, item.high.exchange, item.low.exchange, time, item.spreadPercent.best);
        chart.addPointAnnotation(point);
    }
}

function getChart(symbol) {
    if (!charts.has(symbol)) {
        let id = symbol.replace('/', '').toLowerCase();
        let wrapper = document.getElementById('charts');
        let target = document.createElement('div');
        target.id = 'target-' + id;
        wrapper.appendChild(target);

        let loader = document.getElementById('loader');
        if (loader) {
            loader.remove();
        }

        let options = {
            chart: {
                id: 'chart-' + id,
                height: 250,
                type: 'line',
                animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                        speed: 1000
                    }
                },
                foreColor: colors.foreground,
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                }
            },
            title: {
                text: symbol,
                align: 'left'
            },
            series: [
                { name: 'best', data: [] },
                { name: 'short', data: [] }
            ],
            colors: [colors.best, colors.short],
            stroke: {
                curve: 'smooth',
                width: 3
            },
            markers: {
                size: 0,
                hover: {
                    sizeOffset: 5
                }
            },
            fill: {
                type: 'gradient',
                gradient: {
                    type: 'vertical',
                    gradientToColors: [colors.bestTop, colors.shortTop]
                }
            },
            grid: {
                borderColor: colors.grid,
            },
            xaxis: {
                type: 'datetime',
                axisTicks: {
                    color: colors.grid
                },
                axisBorder: {
                    color: colors.grid
                },
                labels: {
                    formatter: function (value, timestamp) {
                        return Intl.DateTimeFormat('en', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(timestamp))
                    },
                }
            },
            yaxis: {
                decimalsInFloat: 3
            },
            dataLabels: {
                enabled: false
            },
            legend: {
                show: false
            },
            tooltip: {
                theme: 'dark',
                x: {
                    formatter: function (timestamp) {
                        return Intl.DateTimeFormat('en', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }).format(new Date(timestamp))
                    }
                }
            }
        };

        let chart = new ApexCharts(document.querySelector('#' + target.id), options);
        chart.render();

        charts.set(symbol, chart);
    }
    return charts.get(symbol);
}

function getAnnotation(type, high, low, x, y) {
    return {
        x,
        y,
        marker: {
            size: 2,
        },
        label: {
            text: `${type}: ${high}/${low}`,
            style: {
                color: colors.foreground,
                background: colors[type]
            }
        }
    };
}
