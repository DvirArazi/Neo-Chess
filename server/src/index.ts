import express from 'express'
import next from 'next'
import http from 'http'
import { Server } from 'socket.io'
import path from 'path'
import handleSocket from './handleSocket'
import { SocketServer } from './utils/types'
import * as dotenv from 'dotenv'
import { Terminal } from './utils/terminal'

dotenv.config({
  path: ".env"
});

const port = parseInt(process.env.PORT || "3000");
const dev = process.env.NODE_ENV !== 'production';

const app = next({
  dev, hostname: 'localhost', port: port,
  dir: "./client"
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express()
  const httpServer = http.createServer(expressApp);
  const webSocketServer: SocketServer = new Server(httpServer, {
    cors: {
      origin: '*'
    },
    pingInterval: 1000
  });

  const publicFolder = path.join(process.cwd(), '/client/public/');

  expressApp.use(express.static(publicFolder));

  handleSocket(webSocketServer);

  expressApp.all('*', (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, () => {
    Terminal.log(`Listening on http://localhost:${port}`);
  });
}).catch((reason) => {
  console.error(reason);
});