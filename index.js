const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const log = require('./logging');

require('./runner');

const port = process.env.PORT || 3000;

app.use(express.static('static'));

io.on('connection', (socket) => {
    log.info('connected');
    socket.on('disconnect', () => {
        log.info('disconnected');
    });
});

http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
});

exports.notify = function(event, args) {
    io.emit(event, args);
};