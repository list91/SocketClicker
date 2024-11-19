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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.commands) {
    message.commands.forEach((command: Command) => {
      console.log('Received command:', command);
      
      command.params.data.forEach((action: ActionBase) => {
          console.log('step:', action.action);
          setTimeout(() => {
            switch (action.action) {
              case 'go':
                if (action.value) {
                  window.location.href = action.value;
                }
                break;
              
              case 'input':
                if (action.element_xpath && action.value) {
                  const element = document.evaluate(
                    action.element_xpath,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                  ).singleNodeValue as HTMLInputElement;

                  if (element) {
                    element.value = action.value;
                  }
                }
                break;
              
              case 'click':
                if (action.element_xpath) {
                  const element = document.evaluate(
                    action.element_xpath,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                  ).singleNodeValue;

                  if (element) {
                    (element as HTMLElement).click();
                  }
                }
                break;
            }
          }, action.on_start);
        });
    });
  }
});