import { browser } from 'webextension-polyfill-ts';

console.log('Background script loaded');

let pressInterval: number | null = null;

// Функция для эмуляции нажатия клавиши Q
async function pressQ(tabId: number) {
    console.log(`Pressing Q key in tab ${tabId}`);
    
    try {
        // Выполняем скрипт в активной вкладке для симуляции нажатия клавиши
        await browser.tabs.executeScript(tabId, {
            code: `
                (function() {
                    // Получаем активный элемент
                    const activeElement = document.activeElement;
                    console.log('Active element:', activeElement);

                    // Если активный элемент - это input или textarea
                    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                        console.log('Input/textarea is focused, inserting Q');
                        
                        // Получаем текущую позицию курсора
                        const start = activeElement.selectionStart;
                        const end = activeElement.selectionEnd;
                        
                        // Вставляем 'q' в текущую позицию
                        const value = activeElement.value;
                        activeElement.value = value.slice(0, start) + 'q' + value.slice(end);
                        
                        // Обновляем позицию курсора
                        activeElement.selectionStart = activeElement.selectionEnd = start + 1;
                        
                        // Создаем событие input для обновления значения
                        const inputEvent = new Event('input', { bubbles: true });
                        activeElement.dispatchEvent(inputEvent);
                    }

                    // В любом случае отправляем события keydown/keyup
                    const target = activeElement || document;
                    
                    // Создаем и отправляем keydown event
                    const downEvent = new KeyboardEvent('keydown', {
                        key: 'q',
                        code: 'KeyQ',
                        keyCode: 81,
                        which: 81,
                        bubbles: true,
                        cancelable: true
                    });
                    target.dispatchEvent(downEvent);

                    // Создаем и отправляем keypress event для символьных клавиш
                    const pressEvent = new KeyboardEvent('keypress', {
                        key: 'q',
                        code: 'KeyQ',
                        keyCode: 81,
                        which: 81,
                        bubbles: true,
                        cancelable: true
                    });
                    target.dispatchEvent(pressEvent);

                    // Создаем и отправляем keyup event
                    const upEvent = new KeyboardEvent('keyup', {
                        key: 'q',
                        code: 'KeyQ',
                        keyCode: 81,
                        which: 81,
                        bubbles: true,
                        cancelable: true
                    });
                    target.dispatchEvent(upEvent);
                    
                    console.log('Q key press completed');
                })();
            `
        });
    } catch (error) {
        console.error('Error during key press:', error);
    }
}

// Функция для запуска интервала
async function startInterval(tabId: number) {
    if (!pressInterval) {
        console.log('Starting auto-press interval for tab', tabId);
        await pressQ(tabId); // Сразу нажимаем один раз
        pressInterval = window.setInterval(() => pressQ(tabId), 2000);
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

// При установке или обновлении расширения
browser.runtime.onInstalled.addListener(() => {
    console.log('Extension installed/updated');
    // Автоматически запускаем для активной вкладки
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        if (tabs[0] && tabs[0].id) {
            startInterval(tabs[0].id);
        }
    });
});

// Слушаем изменения активной вкладки
browser.tabs.onActivated.addListener(async (activeInfo) => {
    console.log('Tab activated:', activeInfo.tabId);
    // Останавливаем предыдущий интервал
    stopInterval();
    // Запускаем новый интервал для активной вкладки
    await startInterval(activeInfo.tabId);
});

// При обновлении вкладки
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        console.log('Active tab updated:', tabId);
        // Останавливаем предыдущий интервал
        stopInterval();
        // Запускаем новый интервал для обновленной вкладки
        await startInterval(tabId);
    }
});

// Обработчик сообщений от popup
browser.runtime.onMessage.addListener(async (message: { action: string; value?: boolean; type?: string; data?: any }) => {
    console.log('Background received message:', message);
    
    if (message.action === 'toggleAutoQ') {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].id) {
            if (message.value) {
                await startInterval(tabs[0].id);
            } else {
                stopInterval();
            }
        }
    }
    
    return Promise.resolve({ success: true });
});
