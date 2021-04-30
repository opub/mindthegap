const { Server } = require('socket.io');
const log = require('./logging');
let io;

exports.setup = function (http) {
    io = new Server(http);
    io.on('connection', (socket) => {
        log.info('connected');
        socket.on('disconnect', () => {
            log.info('disconnected');
        });
    });
};

exports.notify = function (event, args) {
    if(io) {
        io.emit(event, args);
    } else {
        log.warn('socket not setup');
    }
};
