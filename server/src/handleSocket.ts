import RpcServer from "./utils/types";

const handleSocket = (webSocketServer: RpcServer) => {
    webSocketServer.on('connection', (socket) => {
            // socket.emit("");
    });
};

export default handleSocket;