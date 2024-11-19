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

// Функция для выполнения клика через debugger API
const clickElementWithDebugger = async (tabId: number, xpath: string) => {
  try {
    // Подключаемся к отладчику
    await chrome.debugger.attach({ tabId }, "1.3");
    
    // Находим элемент по XPath
    const { result } = await chrome.debugger.sendCommand({ tabId }, "Runtime.evaluate", {
      expression: `
        (function() {
          const element = document.evaluate(
            "${xpath}",
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2)
          };
        })()
      `
    }) as { result: { value: { x: number; y: number } | null } };

    if (result?.value) {
      // Эмулируем клик мышью
      await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: result.value.x,
        y: result.value.y,
        button: "left",
        clickCount: 1
      });
      
      await chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: result.value.x,
        y: result.value.y,
        button: "left",
        clickCount: 1
      });
    }

    // Отключаемся от отладчика
    await chrome.debugger.detach({ tabId });
    
  } catch (error) {
    console.error('Error in debugger click:', error);
    await chrome.debugger.detach({ tabId }).catch(() => {});
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
          console.log('Processing commands for tab:', tabId);
          
          for (const command of commands) {
            console.log('Processing command:', command);
            
            for (const action of command.params.data) {
              console.log('Processing action:', action);
              
              switch (action.action) {
                case 'click':
                  if (action.element_xpath) {
                    console.log('Clicking element:', action.element_xpath);
                    await clickElementWithDebugger(tabId, action.element_xpath);
                  }
                  break;
                  
                case 'input':
                  if (action.element_xpath && action.value) {
                    console.log('Setting input value:', action.value);
                    await chrome.scripting.executeScript({
                      target: { tabId },
                      func: (xpath: string, value: string) => {
                        const element = document.evaluate(
                          xpath,
                          document,
                          null,
                          XPathResult.FIRST_ORDERED_NODE_TYPE,
                          null
                        ).singleNodeValue;
                        if (element instanceof HTMLInputElement) {
                          element.value = value;
                        }
                      },
                      args: [action.element_xpath, action.value]
                    });
                  }
                  break;
                  
                case 'go':
                  if (action.value) {
                    console.log('Navigating to:', action.value);
                    await chrome.tabs.update(tabId, { url: action.value });
                  }
                  break;
              }
            }
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