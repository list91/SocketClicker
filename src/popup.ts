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
    }

    startButton.addEventListener('click', async () => {
        const command = inputField.value.trim();
        
        if (!command) {
            log('Please enter a command', 'error');
            return;
        }

        log(`Executing command: ${command}`);

        try {
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            
            if (tab.id) {
                const response = await browser.tabs.sendMessage(tab.id, {
                    action: 'executeCommand',
                    command: command
                });

                log(`Response: ${JSON.stringify(response)}`, 'info');
            } else {
                log('No active tab found', 'error');
            }
        } catch (error) {
            log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    });
});