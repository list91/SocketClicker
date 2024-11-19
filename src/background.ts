// Simplified background script to fetch commands every 3 seconds
console.log('Background script started');

// Функция для проверки и загрузки content script
const ensureContentScriptLoaded = async (tabId: number): Promise<boolean> => {
  console.log('Ensuring content script is loaded in tab:', tabId);
  
  try {
    // Пробуем отправить ping
    const response = await chrome.tabs.sendMessage(tabId, { ping: true }).catch(() => false);
    
    if (response === false) {
      console.log('Content script not found, injecting...');
      // Если скрипт не ответил, пробуем загрузить его
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      console.log('Content script injected');
      
      // Проверяем еще раз после загрузки
      const secondResponse = await chrome.tabs.sendMessage(tabId, { ping: true }).catch(() => false);
      if (secondResponse === false) {
        console.warn('Content script still not responding after injection');
        return false;
      }
    }
    
    console.log('Content script is ready');
    return true;
  } catch (error) {
    console.error('Error while ensuring content script:', error);
    return false;
  }
};

setInterval(async () => {
  console.log('Fetching commands...');
  try {
    const response = await fetch('http://localhost:5000/select_last?count=4');
    const commands = await response.json();
    
    console.log('Received commands from server:', commands);
    
    if (commands && commands.length > 0) {
      console.log(`Found ${commands.length} commands to process`);
      
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        console.log('Active tabs:', tabs);
        
        const tabId = tabs[0]?.id;
        if (tabId) {
          console.log('Sending to tab:', tabId);
          
          // Проверяем и при необходимости загружаем content script
          const isReady = await ensureContentScriptLoaded(tabId);
          
          if (isReady) {
            console.log('Tab is ready, sending commands');
            chrome.tabs.sendMessage(tabId, { commands }).catch(error => {
              console.error('Failed to send commands to tab:', error);
            });
          } else {
            console.log('Tab is not ready for commands');
          }
        } else {
          console.log('No active tab found');
        }
      });
    } else {
      console.log('No commands to process');
    }
  } catch (error) {
    console.error('Failed to fetch commands:', error);
  }
}, 3000);