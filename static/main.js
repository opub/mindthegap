var socket = io();

var colors = {
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

socket.on('priceUpdate', function (data) {
    var now = Date.now();
    for (var item of data) {
        console.log(item.symbol, item);
        var chart = getChart(item.symbol);
        console.log('chart', chart);

        chart.appendData([{
            data: [[now, item.spreadPercent.best]]
        }, {
            data: [[now, item.spreadPercent.short]]
        }]);

        if (item.action === 'open' || item.action === 'close' || item.action === 'arbitrage') {
            const point = getAnnotation(item.action, now, item.action === 'arbitrage' ? item.spreadPercent.best : item.spreadPercent.short);
            chart.addPointAnnotation(point);
        }
    }
});

var charts = new Map();

function getChart(symbol) {
    if (!charts.has(symbol)) {
        var id = symbol.replace('/', '').toLowerCase();
        var wrapper = document.getElementById('wrapper');
        var target = document.createElement('div');
        target.id = 'target-' + id;
        wrapper.appendChild(target);

        var loader = document.getElementById('loader');
        if (loader) {
            loader.remove();
        }

        var options = {
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

        var chart = new ApexCharts(document.querySelector('#' + target.id), options);
        chart.render();

        charts.set(symbol, chart);
    }
    return charts.get(symbol);
}

function getAnnotation(type, x, y) {
    return {
        x,
        y,
        marker: {
            size: 2,
        },
        label: {
            text: type,
            style: {
                color: colors.foreground,
                background: colors[type]
            }
        }
    };
}
