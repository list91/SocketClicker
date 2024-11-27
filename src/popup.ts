import { browser } from 'webextension-polyfill-ts';
import { setBadgeText } from "./common";

alert('Popup script loaded!');
console.log('%c Popup script loaded', 'background: #222; color: #bada55; font-size: 16px;');

document.addEventListener('DOMContentLoaded', () => {
    alert('DOM Content Loaded!');
    console.log('%c DOM Content Loaded', 'background: #222; color: #bada55; font-size: 16px;');
    
    const screenshotBtn = document.getElementById('screenshot') as HTMLButtonElement;
    const enabledCheckbox = document.getElementById('enabled') as HTMLInputElement;
    const autoQCheckbox = document.getElementById('autoQ') as HTMLInputElement;
    const itemInput = document.getElementById('item') as HTMLInputElement;

    // Проверяем, что все элементы найдены
    console.log('Elements found:', {
        screenshotBtn: !!screenshotBtn,
        enabledCheckbox: !!enabledCheckbox,
        autoQCheckbox: !!autoQCheckbox,
        itemInput: !!itemInput
    });

    if (!autoQCheckbox) {
        console.error('autoQ checkbox not found!');
        return;
    }

    // Загружаем сохраненные настройки
    browser.storage.local.get(['enabled', 'item', 'autoQ']).then((result) => {
        console.log('%c Loading saved settings:', 'color: #00ff00', result);
        enabledCheckbox.checked = result.enabled || false;
        itemInput.value = result.item || '';
        autoQCheckbox.checked = result.autoQ || false;
        
        // Устанавливаем начальное состояние бейджа
        setBadgeText(result.enabled ? 'ON' : 'OFF');
        
        // Если autoQ был включен, активируем его
        if (result.autoQ) {
            console.log('%c Auto Q was previously enabled, activating...', 'color: #ff9900');
            toggleAutoQ(true);
        }
    });

    // Сохраняем настройки при изменении
    enabledCheckbox.addEventListener('change', (event) => {
        const isEnabled = enabledCheckbox.checked;
        alert('Enable checkbox changed: ' + isEnabled);
        console.log('%c Enable checkbox changed:', 'color: #00ff00', {
            checked: isEnabled,
            event: event.type,
            timestamp: new Date().toISOString()
        });
        browser.storage.local.set({ enabled: isEnabled });
        setBadgeText(isEnabled ? 'ON' : 'OFF');
        console.log('Enable checkbox changed to:', isEnabled);
    });

    itemInput.addEventListener('change', (event) => {
        console.log('%c Item input changed:', 'color: #00ff00', {
            value: itemInput.value,
            event: event.type,
            timestamp: new Date().toISOString()
        });
        browser.storage.local.set({ item: itemInput.value });
        console.log('Item input changed to:', itemInput.value);
    });

    // Обработчик для автонажатия Q
    autoQCheckbox.addEventListener('change', (event) => {
        const isEnabled = autoQCheckbox.checked;
        alert('Auto Q checkbox changed: ' + isEnabled);
        console.log('%c Auto Q checkbox changed:', 'color: #ff9900', {
            checked: isEnabled,
            event: event.type,
            timestamp: new Date().toISOString()
        });
        browser.storage.local.set({ autoQ: isEnabled });
        toggleAutoQ(isEnabled);
        console.log('Auto Q checkbox changed to:', isEnabled);
    });

    // Функция для включения/выключения автонажатия Q
    async function toggleAutoQ(enabled: boolean) {
        try {
            console.log('%c Trying to toggle Auto Q:', 'color: #ff9900', {
                enabled: enabled,
                timestamp: new Date().toISOString()
            });
            
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            console.log('%c Current tab:', 'color: #ff9900', tab);
            
            if (tab.id) {
                console.log('%c Sending message to content script...', 'color: #ff9900');
                const response = await browser.tabs.sendMessage(tab.id, {
                    action: 'toggleAutoQ',
                    value: enabled
                });
                console.log('%c Content script response:', 'color: #ff9900', response);
            } else {
                console.error('No tab ID found');
            }
        } catch (error) {
            console.error('Failed to toggle auto Q:', error);
            console.log('%c Error details:', 'color: #ff0000', {
                error: error,
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Обработчик для кнопки скриншота
    screenshotBtn.addEventListener('click', async () => {
        alert('Screenshot button clicked');
        console.log('%c Screenshot button clicked', 'color: #00ff00');
        try {
            // Получаем активную вкладку
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.id) {
                throw new Error('No active tab found');
            }

            // Делаем скриншот активной вкладки
            const screenshot = await browser.tabs.captureVisibleTab(undefined, { format: 'png' });
            
            // Отправляем сообщение в background script для сохранения скриншота
            await browser.runtime.sendMessage({
                type: 'SAVE_SCREENSHOT',
                data: {
                    dataUrl: screenshot,
                    tabId: tab.id
                }
            });

            // Показываем уведомление об успехе
            await browser.notifications.create({
                type: 'basic',
                iconUrl: '/icons/icon48.png',
                title: 'Screenshot taken',
                message: 'Screenshot has been saved to downloads/socketClickerOut'
            });

            console.log('%c Screenshot saved successfully', 'color: #00ff00');
        } catch (error) {
            console.error('Failed to take screenshot:', error);
            
            // Показываем уведомление об ошибке
            await browser.notifications.create({
                type: 'basic',
                iconUrl: '/icons/icon48.png',
                title: 'Screenshot Error',
                message: 'Failed to take screenshot'
            });
        }
    });
});
