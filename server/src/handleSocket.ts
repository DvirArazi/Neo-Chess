import { RpcServer } from 'shared/rpcTypes';

const handleSocket = (webSocketServer: RpcServer) => {
    webSocketServer.on('connection', (socket) => {
        console.log("hello");
        setTimeout(() => {
            socket.emit("blue");
        }, 2000);
    });
};

export default handleSocket;