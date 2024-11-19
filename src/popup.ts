document.addEventListener('DOMContentLoaded', () => {
    console.log('[Popup] DOM loaded');
    
    const button = document.createElement('button');
    button.textContent = 'Click me';
    document.body.appendChild(button);
    console.log('[Popup] Button created');

    button.addEventListener('click', () => {
        console.log('[Popup] Button clicked');
        chrome.runtime.sendMessage({ type: 'test' }, (response) => {
            console.log('[Popup] Got response:', response);
        });
    });
});
