import { checkQueueStatus } from './queueChecker';

// Запускаем первую проверку сразу
checkQueueStatus();

// Устанавливаем интервал проверки каждые 3 секунды
setInterval(checkQueueStatus, 2000);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'countLinks') {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0].id) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: countLinks
                });
            }
        });
    }
});

// Function to count links
function countLinks() {
    const links = document.getElementsByTagName('a');
    const count = links.length;
    
    if (count === 0) {
        alert('No links found on this page');
    } else {
        alert(`Found ${count} link${count === 1 ? '' : 's'} on this page`);
    }
}