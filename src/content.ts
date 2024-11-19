// Интерфейсы для команд
interface ActionBase {
  on_start: number;
  action: 'go' | 'input' | 'click';
  element_xpath?: string;
  value?: string;
}

interface Command {
  id: string;
  command: string;
  params: {
    data: ActionBase[];
  };
  time_created: string;
}

console.log('Content script loaded and ready');

chrome.runtime.onMessage.addListener((message: { commands?: Command[], ping?: boolean }, sender, sendResponse) => {
  console.log('Received message:', message);
  
  // Отвечаем на ping
  if (message.ping) {
    console.log('Received ping, responding...');
    sendResponse(true);
    return;
  }

  // Обрабатываем команды
  if (message.commands) {
    console.log(`Processing ${message.commands.length} commands`);
    
    message.commands.forEach((command) => {
      console.log('Processing command:', command);
      
      command.params.data.forEach((action) => {
        console.log('Scheduling action:', action);
        setTimeout(() => {
          console.log('Executing action:', action);
          
          switch (action.action) {
            case 'go':
              if (action.value) {
                console.log('Navigating to:', action.value);
                window.location.href = action.value;
              } else {
                console.warn('Go action missing value');
              }
              break;
            
            case 'input':
              if (action.element_xpath && action.value) {
                console.log('Finding input element:', action.element_xpath);
                const element = document.evaluate(
                  action.element_xpath,
                  document,
                  null,
                  XPathResult.FIRST_ORDERED_NODE_TYPE,
                  null
                ).singleNodeValue;

                if (element instanceof HTMLInputElement) {
                  console.log('Setting input value:', action.value);
                  element.value = action.value;
                } else {
                  console.warn('Element found but not an input:', element);
                }
              } else {
                console.warn('Input action missing xpath or value');
              }
              break;
            
            case 'click':
              if (action.element_xpath) {
                console.log('Finding element to click:', action.element_xpath);
                const element = document.evaluate(
                  action.element_xpath,
                  document,
                  null,
                  XPathResult.FIRST_ORDERED_NODE_TYPE,
                  null
                ).singleNodeValue;

                if (element instanceof HTMLElement) {
                  console.log('Clicking element');
                  element.click();
                } else {
                  console.warn('Element found but not clickable:', element);
                }
              } else {
                console.warn('Click action missing xpath');
              }
              break;
            
            default:
              console.warn('Unknown action type:', action.action);
          }
        }, action.on_start || 0);
      });
    });
  } else {
    console.log('Message contained no commands');
  }

  // Важно вернуть true если мы используем sendResponse асинхронно
  return true;
});