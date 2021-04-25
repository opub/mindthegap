//starts background processes
require('./runner');

const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const log = require('./logging');
const db = require('./db');
const { execute } = require('./utils');
const port = process.env.PORT || 3000;

exports.notify = function (event, args) {
    io.emit(event, args);
};

function start() {
    app.use(express.static('static'));

    app.route('/spreads/:time?').get(function (req, res) {
        log.info('GET /spreads/', req.params.time);
        const spreads = db.getSpreads(req.params.time);
        res.send(spreads);
    });

    io.on('connection', (socket) => {
        log.info('connected');
        socket.on('disconnect', () => {
            log.info('disconnected');
        });
    });

    http.listen(port, () => {
        log.info(`server running at http://localhost:${port}/`);
    });
}

execute(start);