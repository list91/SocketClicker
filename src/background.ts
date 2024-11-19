// Simplified background script to fetch commands every 3 seconds
console.log('Background script started');

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
          try {
            // Проверяем, что таб доступен для отправки сообщений
            console.log('Checking if tab is ready...');
            const response = await chrome.tabs.sendMessage(tabId, { ping: true }).catch(() => {
              console.log('Tab did not respond to ping');
              return false;
            });
            
            if (response !== false) {
              console.log('Tab is ready, sending commands');
              chrome.tabs.sendMessage(tabId, { commands }).catch(error => {
                console.error('Failed to send commands to tab:', error);
              });
            } else {
              console.log('Tab is not ready for commands');
            }
          } catch (error) {
            console.error('Error while communicating with tab:', error);
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