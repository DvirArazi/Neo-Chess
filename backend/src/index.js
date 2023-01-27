import express from 'express';
import next from 'next';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import handleSocket from './handleSocket';
import * as dotenv from 'dotenv';
import { Terminal } from './utils/terminal';
dotenv.config({
    path: ".env"
});
var port = parseInt(process.env.PORT || "3000");
var dev = process.env.NODE_ENV !== 'production';
var app = next({
    dev: dev,
    hostname: 'localhost', port: port,
    dir: "./frontend"
});
var handle = app.getRequestHandler();
app.prepare().then(function () {
    var expressApp = express();
    var httpServer = http.createServer(expressApp);
    var webSocketServer = new Server(httpServer, {
        cors: {
            origin: '*'
        },
        pingInterval: 1000
    });
    var publicFolder = path.join(process.cwd(), '/client/public/');
    expressApp.use(express.static(publicFolder));
    handleSocket(webSocketServer);
    expressApp.all('*', function (req, res) {
        return handle(req, res);
    });
    httpServer.listen(port, function () {
        Terminal.log("Listening on http://localhost:".concat(port));
    });
}).catch(function (reason) {
    Terminal.error(reason);
});
