import { browser } from 'webextension-polyfill-ts';
import { setBadgeText } from "./common";

document.addEventListener('DOMContentLoaded', () => {
    const screenshotBtn = document.getElementById('screenshot') as HTMLButtonElement;
    const enabledCheckbox = document.getElementById('enabled') as HTMLInputElement;
    const itemInput = document.getElementById('item') as HTMLInputElement;

    // Загружаем сохраненные настройки
    browser.storage.local.get(['enabled', 'item']).then((result) => {
        enabledCheckbox.checked = result.enabled || false;
        itemInput.value = result.item || '';
        // Устанавливаем начальное состояние бейджа
        setBadgeText(result.enabled ? 'ON' : 'OFF');
    });

    // Сохраняем настройки при изменении
    enabledCheckbox.addEventListener('change', () => {
        const isEnabled = enabledCheckbox.checked;
        browser.storage.local.set({ enabled: isEnabled });
        setBadgeText(isEnabled ? 'ON' : 'OFF');
    });

    itemInput.addEventListener('change', () => {
        browser.storage.local.set({ item: itemInput.value });
    });

    // Обработчик для кнопки скриншота
    screenshotBtn.addEventListener('click', async () => {
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
