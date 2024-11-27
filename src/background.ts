import { browser } from 'webextension-polyfill-ts';

// Создаем папку для сохранения скриншотов если она не существует
browser.runtime.onInstalled.addListener(() => {
    // Папка будет создана автоматически при первом сохранении
    console.log('Extension installed');
});

// Обработчик сообщений
browser.runtime.onMessage.addListener(async (message: { type: string; data: { dataUrl: string; tabId: number } }) => {
    if (message.type === 'SAVE_SCREENSHOT') {
        try {
            // Получаем текущую дату и время для имени файла
            const date = new Date();
            const fileName = `screenshot_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}.png`;

            // Конвертируем base64 в blob
            const response = await fetch(message.data.dataUrl);
            const blob = await response.blob();

            // Сохраняем файл
            await browser.downloads.download({
                url: URL.createObjectURL(blob),
                filename: `socketClickerOut/${fileName}`,
                saveAs: false
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to save screenshot:', error instanceof Error ? error.message : 'Unknown error');
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
});
