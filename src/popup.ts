import { browser } from 'webextension-polyfill-ts';
import { KEY_CONFIG } from './config';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup opened');

    // Получаем элементы
    const autoKeyCheckbox = document.getElementById('autoKey') as HTMLInputElement;
    const keyLabel = document.getElementById('keyLabel') as HTMLSpanElement;

    // Проверяем, что элементы найдены
    if (!autoKeyCheckbox || !keyLabel) {
        console.error('Required elements not found');
        return;
    }

    // Восстанавливаем состояние чекбокса из localStorage
    const savedState = localStorage.getItem('autoKeyEnabled') === 'true';
    autoKeyCheckbox.checked = savedState;

    // Обновляем текст метки
    const sequence = KEY_CONFIG.KEY_SEQUENCE.map(key => key.toUpperCase()).join(' + ');
    keyLabel.textContent = `Auto Press '${sequence}'`;

    console.log('Elements found:', {
        autoKeyCheckbox: !!autoKeyCheckbox,
        keyLabel: !!keyLabel
    });

    // Функция для включения/выключения автонажатия клавиш
    async function toggleAutoPress(enabled: boolean) {
        console.log('Toggling auto press:', enabled);
        localStorage.setItem('autoKeyEnabled', String(enabled)); // Сохраняем состояние в localStorage
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].id) {
            await browser.runtime.sendMessage({
                action: 'toggleAutoPress',
                value: enabled
            });
        }
    }

    // Слушаем изменения чекбокса
    autoKeyCheckbox.addEventListener('change', async () => {
        const isEnabled = autoKeyCheckbox.checked;

        // Сохраняем состояние в localStorage
        localStorage.setItem('autoKeyEnabled', isEnabled.toString());

        // Отправляем сообщение в background скрипт
        try {
            await browser.runtime.sendMessage({
                action: 'toggleAutoPress',
                value: isEnabled
            });
        } catch (error) {
            console.error('Error sending toggle message:', error);
        }
    });
});