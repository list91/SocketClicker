function arrayBuffer2String(buf: ArrayBuffer, callback: (result: string) => void): void {
    const blob = new Blob([new Uint8Array(buf)]);
    const fileReader = new FileReader();
    fileReader.onload = function (e) {
        callback(e.target?.result as string);
    };
    fileReader.readAsText(blob);
}

const socket = chrome.socket;
socket.create('tcp', {}, function onServerSocketCreate(socketInfo: { socketId: number }) {
    const socketId: number = socketInfo.socketId;
    const address: string = '127.0.0.1';
    const port: number = 3309;

    socket.listen(socketId, address, port, 1, function (result) {
        console.assert(result === 0, 'Listen failed');
        
        socket.getInfo(socketId, function (info) {
            console.log('Server listening on http://localhost:' + info.localPort);
            acceptConnection(socketId);
        });
    });

    function acceptConnection(socketId: number): void {
        socket.accept(socketId, function onServerSocketAccept(acceptInfo: { resultCode: number; socketId?: number }) {
            console.assert(acceptInfo.resultCode === 0, 'Accept failed');
            if (acceptInfo.socketId !== undefined) {
                const acceptedSocketId: number = acceptInfo.socketId;

                console.log('Connection accepted, socket ID:', acceptedSocketId);
                readSocketData(acceptedSocketId);
            } else {
                console.error('Accepted socket ID is undefined');
            }
        });
    }

    function readSocketData(acceptedSocketId: number): void {
        socket.read(acceptedSocketId, 1024, function onRead(readInfo: { resultCode: number; data?: ArrayBuffer }) {
            if (readInfo.resultCode < 0) {
                console.error('Error reading data:', chrome.runtime.lastError?.message);
                socket.destroy(acceptedSocketId); // Все еще используем close здесь
                return;
            }
            
            if (readInfo.data) {
                arrayBuffer2String(readInfo.data, function(str: string) {
                    console.log(`Received data: ${str}`);

                    if (str.includes('\r\n\r\n')) {
                        sendResponse(acceptedSocketId);
                    } else {
                        readSocketData(acceptedSocketId);
                    }
                });
            }
        });
    }

    function sendResponse(acceptedSocketId: number): void {
        const responseBody: string = 'Hello, World!';
        const response: string = 'HTTP/1.1 200 OK\r\n' +
            'Server: chrome24\r\n' +
            'Content-Length: ' + responseBody.length + '\r\n' +
            'Connection: Close\r\n' +
            'Content-Type: text/plain\r\n\r\n' +
            responseBody;
    
        const responseBuffer: ArrayBuffer = new TextEncoder().encode(response).buffer;
    
        socket.write(acceptedSocketId, responseBuffer, function onWrite(writeInfo) {
            if (chrome.runtime.lastError) {
                console.error('Error sending response:', chrome.runtime.lastError.message);
            } else {
                console.log('Response sent');
                socket.disconnect(acceptedSocketId)
                socket.destroy(acceptedSocketId); // Закрываем соединение, если ответ успешно отправлен
            }
        });
    }
    
});
