import express from 'express'
import next from 'next'
import http from 'http'
import { Server } from 'socket.io'
import path from 'path'
import handleSocket from './handleSocket'
import { WebSocketServer } from './utils/types'
import * as dotenv from 'dotenv'
import { Terminal } from './utils/terminal'
import helmet from 'helmet'

dotenv.config({
  path: ".env"
});

const port = parseInt(process.env.PORT || "3000");
const dev = process.env.NODE_ENV !== 'production';

const app = next({
  dev, hostname: 'localhost', port: port,
  dir: "./frontend"
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express()
  const httpServer = http.createServer(expressApp);
  const webSocketServer: WebSocketServer = new Server(httpServer, {
    cors: {
      origin: '*'
    },
    pingInterval: 1000
  });

  const publicFolder = path.join(process.cwd(), '/client/public/');

  if (process.env.NODE_ENV === "production") {
    expressApp.use(helmet());
  }
  expressApp.use(express.static(publicFolder));

  handleSocket(webSocketServer);

  expressApp.all('*', (req, res) => {
    res.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    return handle(req, res);
  });

  httpServer.listen(port, () => {
    Terminal.log(`Listening on http://localhost:${port}`);
  });
}).catch((reason) => {
  Terminal.error(reason);
});