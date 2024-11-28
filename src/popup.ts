import { browser } from 'webextension-polyfill-ts';

document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('inputField') as HTMLInputElement;
    const startButton = document.getElementById('startButton') as HTMLButtonElement;
    const logOutput = document.getElementById('logOutput') as HTMLDivElement;

    function log(message: string, type: 'info' | 'error' = 'info') {
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logEntry.classList.add(type);
        logOutput.appendChild(logEntry);
        logOutput.scrollTop = logOutput.scrollHeight;
        console.log(message);  // Добавляем консольный лог
    }

    startButton.addEventListener('click', async () => {
        log('Starting sequence of actions');

        try {
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.id) {
                log('No active tab found', 'error');
                return;
            }

            log(`Active tab ID: ${tab.id}`);  // Логируем ID вкладки

            // Сначала кликаем по XPath
            log('Sending clickByXPath message');
            const clickResult = await browser.runtime.sendMessage({
                action: 'clickByXPath', 
                xpath: '/html/body/div[1]/div/div/div[2]/header/div/div/div/div[1]/div[3]/a'
            });

            log(`Click result: ${JSON.stringify(clickResult)}`, 
                clickResult?.success ? 'info' : 'error');

            // Небольшая задержка после клика
            await new Promise(resolve => setTimeout(resolve, 500));

            // Затем вводим текст
            log('Sending typeText message');
            const typeResult = await browser.runtime.sendMessage({
                action: 'typeText',
                text: 'привет мир'
            });

            log(`Type result: ${JSON.stringify(typeResult)}`, 
                typeResult?.success ? 'info' : 'error');

        } catch (error) {
            log(`Catch block error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            console.error(error);  // Полный вывод ошибки в консоль
        }
    });

    // Добавляем обработку Enter в поле ввода
    inputField.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            startButton.click();
        }
    });
});