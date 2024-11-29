import { browser } from 'webextension-polyfill-ts';

document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('inputField') as HTMLInputElement;
    const startButton = document.getElementById('startButton') as HTMLButtonElement;
    const logOutput = document.getElementById('logOutput') as HTMLDivElement;
    const autoRCheckbox = document.getElementById('autoR') as HTMLInputElement;

    function log(message: string, type: 'info' | 'error' = 'info') {
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logEntry.classList.add(type);
        logOutput.appendChild(logEntry);
        logOutput.scrollTop = logOutput.scrollHeight;
        console.log(message);
    }

    startButton.addEventListener('click', async () => {
        log('Starting sequence of actions');

        try {
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.id) {
                log('No active tab found', 'error');
                return;
            }

            log(`Active tab ID: ${tab.id}`);

            // Send message to background script to handle web interactions
            const clickResult = await browser.runtime.sendMessage({
                action: 'performWebActions'
            });

            log(`Action result: ${JSON.stringify(clickResult)}`, 
                clickResult?.success ? 'info' : 'error');

        } catch (error) {
            log(`Catch block error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            console.error(error);
        }
    });

    // Enter key handling remains the same
    inputField.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            startButton.click();
        }
    });

    // Функция для включения/выключения автонажатия клавиши R
    async function toggleAutoR(enabled: boolean) {
        console.log('Toggling auto R:', enabled);
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].id) {
            await browser.runtime.sendMessage({
                action: 'toggleAutoR',
                value: enabled
            });
        }
    }

    // Слушаем изменения чекбокса
    autoRCheckbox.addEventListener('change', () => {
        const isEnabled = autoRCheckbox.checked;
        console.log('Auto R checkbox changed to:', isEnabled);
        toggleAutoR(isEnabled);
    });
});