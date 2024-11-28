import { browser } from 'webextension-polyfill-ts';

// Немедленно выводим сообщение при загрузке скрипта
alert('Content Script Loaded!');
console.log('%c Content Script Loaded! ', 'background: #222; color: #bada55; font-size: 30px;');

let pressInterval: number | null = null;

// Вывод информации о загрузке скрипта
console.log('=== Content Script Details ===');
console.log('URL:', window.location.href);
console.log('Time:', new Date().toLocaleString());
console.log('Document Ready State:', document.readyState);

// Функция для эмуляции нажатия клавиши Q
function pressQ() {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Pressing Q key`);
    
    try {
        // Создаем и отправляем keydown event
        const event = new KeyboardEvent('keydown', {
            key: 'q',
            code: 'KeyQ',
            keyCode: 81,
            which: 81,
            bubbles: true,
            cancelable: true
        });
        const keydownSuccess = document.dispatchEvent(event);
        console.log('Keydown event dispatched:', keydownSuccess);

        // Создаем и отправляем keyup event
        const upEvent = new KeyboardEvent('keyup', {
            key: 'q',
            code: 'KeyQ',
            keyCode: 81,
            which: 81,
            bubbles: true,
            cancelable: true
        });
        const keyupSuccess = document.dispatchEvent(upEvent);
        console.log('Keyup event dispatched:', keyupSuccess);
        
        console.log(`[${timestamp}] Q key press completed`);
    } catch (error) {
        console.error('Error during key press:', error);
        alert('Error during key press: ' + error);
    }
}

// Функция для ввода текста с имитацией нажатия клавиш
function typeText(text: string) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Typing text: ${text}`);
    
    try {
        // Получаем активный элемент ввода
        const activeInput = document.activeElement as HTMLInputElement;
        
        if (!activeInput) {
            console.error('No active input element found');
            return false;
        }

        // Очищаем существующий текст
        activeInput.value = '';

        // Вводим текст посимвольно
        for (const char of text) {
            // Создаем события для каждого символа
            const keydownEvent = new KeyboardEvent('keydown', {
                key: char,
                bubbles: true,
                cancelable: true
            });
            
            const inputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: true
            });

            const keyupEvent = new KeyboardEvent('keyup', {
                key: char,
                bubbles: true,
                cancelable: true
            });

            // Диспетчеризация событий
            activeInput.dispatchEvent(keydownEvent);
            activeInput.value += char;
            activeInput.dispatchEvent(inputEvent);
            activeInput.dispatchEvent(keyupEvent);
        }

        // Триггерим событие change
        const changeEvent = new Event('change', { bubbles: true });
        activeInput.dispatchEvent(changeEvent);

        console.log(`[${timestamp}] Text typing completed`);
        return true;
    } catch (error) {
        console.error('Error during text typing:', error);
        return false;
    }
}

// Функция для запуска интервала
function startInterval() {
    if (!pressInterval) {
        console.log('%c Starting auto-press interval ', 'background: #222; color: #bada55');
        alert('Starting auto-press interval');
        pressQ(); // Сразу нажимаем один раз
        pressInterval = window.setInterval(pressQ, 2000);
        console.log('Interval ID:', pressInterval);
    }
}

// Функция для остановки интервала
function stopInterval() {
    if (pressInterval) {
        console.log('Stopping interval:', pressInterval);
        clearInterval(pressInterval);
        pressInterval = null;
    }
}

// Запускаем нажатие Q когда документ загружен
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded - starting interval');
        startInterval();
    });
} else {
    console.log('Document already loaded - starting interval immediately');
    startInterval();
}

// Для возможности остановки через popup оставляем слушатель сообщений
browser.runtime.onMessage.addListener((message: { action: string; value?: boolean; text?: string }) => {
    console.log('Message received:', message);
    
    if (message.action === 'toggleAutoQ') {
        if (message.value) {
            startInterval();
        } else {
            stopInterval();
        }
    } else if (message.action === 'typeText' && message.text) {
        const result = typeText(message.text);
        return Promise.resolve({ success: result });
    }
    return Promise.resolve({ success: false });
});

// Выводим сообщение при выгрузке скрипта
window.addEventListener('unload', () => {
    console.log('Content script unloading, cleaning up...');
    stopInterval();
});
