// Simplified background script to fetch commands every 3 seconds
setInterval(async () => {
  try {
    const response = await fetch('http://localhost:5000/select_last?count=4');
    const commands = await response.json();
    
    if (commands && commands.length) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { commands });
        }
      });
    }
  } catch (error) {
    console.error('Failed to fetch commands:', error);
  }
}, 3000);