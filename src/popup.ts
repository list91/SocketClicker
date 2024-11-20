document.addEventListener('DOMContentLoaded', () => {
    console.log('[Popup] DOM loaded');
    
    // Отображаем статус расширения
    const statusElement = document.getElementById('status');
    if (statusElement) {
        chrome.runtime.sendMessage({ type: 'getStatus' }, (response) => {
            statusElement.textContent = `Status: ${response.status}`;
        });
    }
});
