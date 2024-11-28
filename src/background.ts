import { browser } from 'webextension-polyfill-ts';

console.log('Background script loaded');

// Обработчик сообщений от popup
browser.runtime.onMessage.addListener(async (message, sender) => {
    
});
