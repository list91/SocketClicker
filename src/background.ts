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

// Функция для отправки команды в историю
const moveCommandToHistory = async (commandId: string) => {
  try {
    const response = await fetch('http://localhost:5000/move_to_history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: [commandId]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to move command to history: ${response.statusText}`);
    }
    
    console.log('Command moved to history:', commandId);
  } catch (error) {
    console.error('Error moving command to history:', error);
  }
};

// Функция для клика через chrome.scripting.executeScript
const clickElementWithScript = async (tabId: number, xpath: string): Promise<boolean> => {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (xpath: string) => {
        const element = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue as HTMLElement;

        if (!element) {
          console.warn('Element not found');
          return false;
        }

        // Создаем события mousedown, mouseup и click
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
          buttons: 1
        });

        const mousedownEvent = new MouseEvent('mousedown', {
          view: window,
          bubbles: true,
          cancelable: true,
          buttons: 1
        });

        const mouseupEvent = new MouseEvent('mouseup', {
          view: window,
          bubbles: true,
          cancelable: true,
          buttons: 1
        });

        // Последовательно запускаем события
        element.dispatchEvent(mousedownEvent);
        element.dispatchEvent(mouseupEvent);
        element.dispatchEvent(clickEvent);

        // Для кнопок и ссылок также пробуем вызвать click()
        if (element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement) {
          element.click();
        }

        return true;
      },
      args: [xpath]
    });

    return results[0].result;
  } catch (error) {
    console.error('Error in script click:', error);
    return false;
  }
};

// Функция для проверки наличия элемента
const waitForElement = async (tabId: number, xpath: string, timeout: number): Promise<boolean> => {
  const startTime = Date.now();
  const checkInterval = 100; // Проверяем каждые 100мс
  let attempts = 0;

  console.log(`[WAIT] Starting to wait for element: ${xpath}`);
  console.log(`[WAIT] Timeout: ${timeout}ms, Check interval: ${checkInterval}ms`);

  while (Date.now() - startTime < timeout) {
    attempts++;
    const elapsedTime = Date.now() - startTime;
    console.log(`[WAIT] Attempt ${attempts}, Elapsed time: ${elapsedTime}ms`);

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: (xpath: string) => {
          try {
            const element = document.evaluate(
              xpath,
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            ).singleNodeValue;
            
            if (element instanceof HTMLElement) {
              const rect = element.getBoundingClientRect();
              return {
                found: true,
                info: {
                  tagName: element.tagName,
                  id: element.id,
                  className: element.className,
                  isVisible: element.offsetParent !== null,
                  position: {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height
                  }
                }
              };
            }
            return { found: false, info: { reason: 'Element not found or not HTMLElement' } };
          } catch (error) {
            return { 
              found: false, 
              info: { 
                reason: 'Error in element search',
                error: error instanceof Error ? error.message : String(error)
              } 
            };
          }
        },
        args: [xpath]
      });

      // Проверяем, что результаты существуют
      if (!results || !results[0] || results[0].result === undefined) {
        console.warn(`[WAIT] Invalid results on attempt ${attempts}:`, results);
        return false;
      }

      const result = results[0].result;
      
      if (result.found) {
        console.log(`[WAIT] ✓ Element found after ${elapsedTime}ms:`, {
          xpath,
          attempts,
          elementInfo: result.info
        });
        return true;
      }

      console.log(`[WAIT] Element not found on attempt ${attempts}:`, result.info);
      console.log(`[WAIT] Waiting ${checkInterval}ms before next check`);
      
      // Ждем перед следующей проверкой
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    } catch (error) {
      console.error(`[WAIT] ✗ Error checking element on attempt ${attempts}:`, error);
      // Продолжаем попытки даже при ошибке
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }

  console.warn(`[WAIT] ✗ Element not found after ${timeout}ms:`, {
    xpath,
    totalAttempts: attempts,
    checkInterval
  });
  return false;
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
            
            let allActionsSuccessful = true;
            
            for (const action of command.params.data) {
              console.log('Processing action:', action);
              let actionSuccess = false;

              // Если есть xpath, ждем появления элемента
              if (action.element_xpath && action.on_start) {
                console.log(`Waiting up to ${action.on_start}ms for element:`, action.element_xpath);
                const elementFound = await waitForElement(tabId, action.element_xpath, action.on_start);
                if (!elementFound) {
                  console.warn('Element not found within timeout, skipping action');
                  allActionsSuccessful = false;
                  break;
                }
              } else if (action.on_start) {
                // Если нет xpath, просто ждем указанное время
                console.log(`Waiting ${action.on_start}ms`);
                await new Promise(resolve => setTimeout(resolve, action.on_start));
              }
              
              switch (action.action) {
                case 'click':
                  if (action.element_xpath) {
                    console.log('Clicking element:', action.element_xpath);
                    actionSuccess = await clickElementWithScript(tabId, action.element_xpath);
                  }
                  break;
                  
                case 'input':
                  if (action.element_xpath && action.value) {
                    console.log('Setting input value:', action.value);
                    try {
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
                            element.dispatchEvent(new Event('input', { bubbles: true }));
                            element.dispatchEvent(new Event('change', { bubbles: true }));
                            return true;
                          }
                          return false;
                        },
                        args: [action.element_xpath, action.value]
                      });
                      actionSuccess = true;
                    } catch (error) {
                      console.error('Error setting input value:', error);
                      actionSuccess = false;
                    }
                  }
                  break;
                  
                case 'go':
                  if (action.value) {
                    console.log('Navigating to:', action.value);
                    try {
                      await chrome.tabs.update(tabId, { url: action.value });
                      actionSuccess = true;
                    } catch (error) {
                      console.error('Error navigating:', error);
                      actionSuccess = false;
                    }
                  }
                  break;
              }
              
              if (!actionSuccess) {
                allActionsSuccessful = false;
                break; // Прерываем выполнение команды при первой неудаче
              }
            }
            
            // Отправляем команду в историю только после выполнения всех действий
            await moveCommandToHistory(command.id);
            console.log(`Command ${command.id} completed with ${allActionsSuccessful ? 'success' : 'failure'}`);
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