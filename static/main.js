var socket = io();

socket.on('priceUpdate', function (data) {
    var now = Date.now();
    for (var item of data) {
        console.log(item.symbol, item);
        var chart = getChart(item.symbol);
        console.log('chart', chart);
        chart.best.append(now, item.spreadPercent.best);
        chart.short.append(now, item.spreadPercent.short);
    }
});

var charts = new Map();

function getChart(symbol) {
    if (!charts.has(symbol)) {
        var wrapper = document.getElementById('wrapper');
        var canvas = document.createElement('canvas');
        canvas.id = 'chart-' + symbol.replace('/', '');
        canvas.width = window.innerWidth;;
        canvas.height = 200;
        wrapper.appendChild(canvas);

        var chart = new SmoothieChart({ tooltip: true, millisPerPixel: 1000, minValueScale: 1.05, maxValueScale: 1.05, title: { text: symbol, fontFamily: 'consolas', fontSize: 20, verticalAlign: 'top' }, grid: { strokeStyle: 'rgba(119,119,119,0.48)', millisPerLine: 40000, verticalSections: 4 },  labels: { fontFamily: 'consolas', fontSize: 16 } });
        var best = new TimeSeries(), short = new TimeSeries();
        chart.addTimeSeries(best, { lineWidth: 3, strokeStyle: '#00ff88' });
        chart.addTimeSeries(short, { lineWidth: 3, strokeStyle: '#0088ff' });
        chart.streamTo(canvas, 976);
        charts.set(symbol, { chart, best, short });
    }
    return charts.get(symbol);
}
