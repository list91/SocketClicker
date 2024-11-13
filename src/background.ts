// function arrayBuffer2String(buf: ArrayBuffer, callback: (result: string) => void): void {
//     const blob = new Blob([new Uint8Array(buf)]);
//     const fileReader = new FileReader();
//     fileReader.onload = function (e) {
//         callback(e.target?.result as string);
//     };
//     fileReader.readAsText(blob);
// }
// // function getCurrentTabId(callback) {
// //     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
// //         if (tabs.length > 0) {
// //             callback(tabs[0].id);
// //         } else {
// //             console.error('No active tab found');
// //             callback(null);
// //         }
// //     });
// // }

// // // Использование
// // getCurrentTabId(function(tabId) {
// //     if (tabId !== null) {
// //         console.log('Current tab ID:', tabId); // Здесь вы получите идентификатор текущей вкладки
// //     }
// // });
// // background.ts
// // background.ts
// chrome.runtime.onInstalled.addListener(() => {
//     // Запускаем парсинг каждые 4 секунды при загрузке расширения
//     setInterval(() => {
//         chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//             const url = tabs[0]?.url;
//             if (url) {
//                 fetchPageContent(url).then(data => {
//                     console.log("Parsed Data:", data);
//                     // Здесь можно сохранить данные, отправить уведомление или что-то еще
//                 }).catch(error => {
//                     console.error("Ошибка парсинга:", error);
//                 });
//             }
//         });
//     }, 4000); // 4000 milliseconds = 4 seconds
// });

// async function fetchPageContent(url: string): Promise<any> {
//     const response = await fetch(url);
//     if (!response.ok) {
//         throw new Error(`Ошибка при загрузке страницы: ${response.statusText}`);
//     }
//     const text = await response.text();
//     const parsedData = parseHTML(text);
//     return parsedData;
// }

// function parseHTML(html: string): any {
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, 'text/html');
//     const title = doc.querySelector('title')?.textContent;
//     return { title };
// }

// const socket = chrome.socket;
// socket.create('tcp', {}, function onServerSocketCreate(socketInfo: { socketId: number }) {
//     const socketId: number = socketInfo.socketId;
//     const address: string = '127.0.0.1';
//     const port: number = 3309;

//     socket.listen(socketId, address, port, 1, function (result) {
//         console.assert(result === 0, 'Listen failed');
        
//         console.log('Server listening on http://localhost:' + port);
//         acceptConnection(socketId);
//     });

//     function acceptConnection(socketId: number): void {
//         socket.accept(socketId, function onServerSocketAccept(acceptInfo: { resultCode: number; socketId?: number }) {
//             console.assert(acceptInfo.resultCode === 0, 'Accept failed');
//             if (acceptInfo.socketId !== undefined) {
//                 const acceptedSocketId: number = acceptInfo.socketId;

//                 console.log('Connection accepted, socket ID:', acceptedSocketId);
//                 readSocketData(acceptedSocketId);
//             } else {
//                 console.error('Accepted socket ID is undefined');
//             }
//         });
//     }

//     function readSocketData(acceptedSocketId: number): void {
//         socket.read(acceptedSocketId, 1024, function onRead(readInfo: { resultCode: number; data?: ArrayBuffer }) {
//             if (readInfo.resultCode < 0) {
//                 console.error('Error reading data:', chrome.runtime.lastError?.message);
//                 socket.destroy(acceptedSocketId);
//                 return;
//             }
            
//             if (readInfo.data) {
//                 arrayBuffer2String(readInfo.data, function(str: string) {
//                     console.log(`Received data: ${str}`);
                    
//                     if (str.includes('\r\n\r\n')) {
//                         console.log(chrome);
//                         const content = document.documentElement.outerHTML; // Получаем HTML содержимое
//                         console.log(content);
//                         // console.log(`Received data: ${chrome}`);
//                         sendResponse(acceptedSocketId);
//                     } else {
//                         readSocketData(acceptedSocketId);
//                     }
//                 });
//             }
//         });
//     }

//     function sendResponse(acceptedSocketId: number): void {
//         const responseBody: string = 'Success';
//         const response: string = 'HTTP/1.1 200 OK\r\n' +
//             'Server: chrome24\r\n' +
//             'Content-Length: ' + responseBody.length + '\r\n' +
//             'Connection: Close\r\n' +
//             'Content-Type: text/plain\r\n\r\n' +
//             responseBody;

//         const responseBuffer: ArrayBuffer = new TextEncoder().encode(response).buffer;

//         socket.write(acceptedSocketId, responseBuffer, function onWrite(writeInfo) {
//             if (chrome.runtime.lastError) {
//                 console.error('Error sending response:', chrome.runtime.lastError.message);
//             } else {
//                 console.log('Response sent');
//                 socket.destroy(acceptedSocketId);
//             }

//             acceptConnection(socketId);
//         });
//     }
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request.command, "@@@")
    if (request.command === 'test') {
        sendResponse({ status: 'SEND RESPONSE' });
    }
});