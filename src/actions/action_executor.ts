import { ActionType, IAction } from './action_collection';

// Интерфейс для результата выполнения действия
export interface IActionResult {
  success: boolean;        // Успешно ли выполнено действие
  error?: string | null;   // Сообщение об ошибке
  data?: any;              // Дополнительные данные
  value?: any;             // Дополнительное значение
}

// Класс для выполнения действий
export class ActionExecutor {
  private timeouts: { [key: string]: number };
  private variables: { [key: string]: any };

  constructor() {
    // Инициализация таймаутов по умолчанию
    this.timeouts = {
      element: 10000,    // Таймаут ожидания элемента
      page: 30000,       // Таймаут загрузки страницы
      script: 10000,     // Таймаут выполнения скрипта
      download: 30000    // Таймаут загрузки файла
    };
    this.variables = {};
  }

  // Основной метод выполнения действия
  async execute(action: IAction): Promise<IActionResult> {
    // Проверка типа действия
    if (!Object.values(ActionType).includes(action.action)) {
      throw new Error('Unsupported action type');
    }

    // Валидация параметров в зависимости от типа действия
    this.validateActionParameters(action);

    try {
      // Если задана задержка перед выполнением
      if (action.on_start) {
        await this.sleep(action.on_start);
      }

      // Выполнение действия в зависимости от типа
      switch (action.action) {
        case ActionType.GO:
          return await this.executeNavigate(action);
        
        case ActionType.CLICK:
          return await this.executeClick(action);
        
        case ActionType.INPUT:
          return await this.executeInput(action);
        
        case ActionType.WAIT:
          return await this.executeWait(action);
        
        case ActionType.GET_TEXT:
          return await this.executeGetText(action);
        
        case ActionType.WAIT_FOR_ELEMENT:
          return await this.executeWaitForElement(action);
        
        case ActionType.WAIT_FOR_PAGE_LOAD:
          return await this.executeWaitForPageLoad(action);
        
        case ActionType.SELECT:
          return await this.executeSelect(action);
        
        case ActionType.CHECK:
          return await this.setCheckbox(action);
        
        case ActionType.SCROLL:
          return await this.executeScroll(action);
        
        case ActionType.EXECUTE_SCRIPT:
          return this.executeScript(action);
        
        default:
          throw new Error(`Unsupported action type: ${action.action}`);
      }
    } catch (error: unknown) {
      // Логирование ошибки
      console.error(`Action execution error: ${(error as Error).message}`, error);
      
      // Пробрасываем ошибку для обработки в тестах
      throw error;
    }
  }

  // Валидация параметров действия
  private validateActionParameters(action: IAction): void {
    switch (action.action) {
      case ActionType.GO:
        if (!action.value) {
          throw new Error('URL is required');
        }
        if (typeof action.value !== 'string') {
          throw new Error('Invalid input value');
        }
        break;
      case ActionType.CLICK:
      case ActionType.INPUT:
      case ActionType.GET_TEXT:
        if (!action.element_xpath) {
          throw new Error('Element xpath is required');
        }
        if (action.action === ActionType.INPUT) {
          if (action.value === null || action.value === undefined || action.value === '') {
            throw new Error('Invalid input value');
          }
        }
        break;
      case ActionType.WAIT:
        if (typeof action.value !== 'number' && isNaN(parseInt(action.value as string, 10))) {
          throw new Error('Invalid wait time');
        }
        break;
      default:
        throw new Error('Unsupported action type');
    }
  }

  // Переход по URL
  private async executeNavigate(action: IAction): Promise<IActionResult> {
    try {
      await this.navigateTo(action.value as string);
      return { success: true };
    } catch (error) {
      console.error('Navigation error:', error);
      throw new Error(`Navigation failed: ${(error as Error).message}`);
    }
  }

  // Клик по элементу
  private async executeClick(action: IAction): Promise<IActionResult> {
    const clickElement = this.findElementByXpath(action.element_xpath as string);
    if (!clickElement) {
      throw new Error('Element not found');
    }
    (clickElement as HTMLElement).click();
    return { success: true };
  }

  // Ввод текста
  private async executeInput(action: IAction): Promise<IActionResult> {
    const inputElement = this.findElementByXpath(action.element_xpath as string);
    if (!inputElement) {
      throw new Error('Element not found');
    }
    (inputElement as HTMLInputElement).value = action.value as string;
    return { success: true };
  }

  // Ожидание
  private async executeWait(action: IAction): Promise<IActionResult> {
    const ms = typeof action.value === 'number' 
      ? action.value 
      : parseInt(action.value as string, 10);

    if (isNaN(ms)) {
      throw new Error('Invalid wait time');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);
        reject(new Error('Action timed out'));
      }, ms);

      timeoutId.unref(); // Prevent timeout from keeping event loop active
    });
  }

  // Получение текста
  private async executeGetText(action: IAction): Promise<IActionResult> {
    const textElement = this.findElementByXpath(action.element_xpath as string);
    if (!textElement) {
      throw new Error('Element not found');
    }
    return { success: true, value: textElement.textContent };
  }

  // Выполнение скрипта
  private executeScript(action: IAction): IActionResult {
    const script = new Function(action.value as string);
    const result = script();
    return { success: true, value: result };
  }

  // Переход по URL
  private async navigateTo(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const mockChrome = (global as any).chrome;
      const globalChrome = typeof chrome !== 'undefined' ? chrome : null;
      
      const chromeObj = mockChrome || globalChrome;
      
      if (!chromeObj?.runtime?.sendMessage) {
        // Fallback to window location if no chrome runtime
        window.location.href = url;
        resolve();
        return;
      }

      const navigationTimeout = setTimeout(() => {
        clearTimeout(navigationTimeout);
        reject(new Error('Navigation timed out'));
      }, this.timeouts.page);

      chromeObj.runtime.sendMessage(
        { action: 'navigate', url },
        (response) => {
          clearTimeout(navigationTimeout);

          if (chromeObj.runtime.lastError) {
            reject(new Error(chromeObj.runtime.lastError.message));
          } else if (response && response.success) {
            resolve();
          } else {
            // Fallback to window location if chrome navigation fails
            try {
              window.location.href = url;
              resolve();
            } catch (error) {
              reject(new Error('Navigation failed'));
            }
          }
        }
      );
    });
  }

  // Ожидание
  private async wait(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);
        reject(new Error('Action timed out'));
      }, ms);
      
      const checkTimeout = () => {
        if (Date.now() - startTime >= ms) {
          clearTimeout(timeoutId);
          resolve();
        } else {
          setTimeout(checkTimeout, 10);
        }
      };
      
      checkTimeout();
    });
  }

  // Поиск элемента по XPath
  private findElementByXpath(xpath: string): Element | null {
    try {
      const result = document.evaluate(
        xpath, 
        document, 
        null, 
        XPathResult.FIRST_ORDERED_NODE_TYPE, 
        null
      );
      return result.singleNodeValue as Element;
    } catch (error) {
      console.error('XPath evaluation error:', error);
      return null;
    }
  }

  // Вспомогательный метод задержки
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Ожидание элемента
  private async executeWaitForElement(action: IAction): Promise<IActionResult> {
    const xpath = action.element_xpath as string;
    const timeout = Number(action.value) || this.timeouts.element;

    try {
      const element = await this.waitForElement(xpath, timeout);
      return { success: true, value: element };
    } catch (error) {
      throw new Error('Element not found within timeout');
    }
  }

  // Ожидание элемента с таймаутом
  private async waitForElement(xpath: string, timeout: number): Promise<Element> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkForElement = () => {
        const element = this.findElementByXpath(xpath);
        
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime >= timeout) {
          reject(new Error('Element not found'));
        } else {
          setTimeout(checkForElement, 100);
        }
      };

      checkForElement();
    });
  }

  // Ожидание загрузки страницы
  private async executeWaitForPageLoad(action: IAction): Promise<IActionResult> {
    const timeout = Number(action.value) || this.timeouts.page;

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkPageLoad = () => {
        if (document.readyState === 'complete') {
          resolve({ success: true });
        } else if (Date.now() - startTime >= timeout) {
          reject(new Error('Page load timeout'));
        } else {
          setTimeout(checkPageLoad, 100);
        }
      };

      checkPageLoad();
    });
  }

  // Выполнение Select
  private async executeSelect(action: IAction): Promise<IActionResult> {
    const selectElement = this.findElementByXpath(action.element_xpath as string) as HTMLSelectElement;
    if (!selectElement) {
      throw new Error('Element not found');
    }

    selectElement.value = action.value as string;
    return { success: true };
  }

  // Установка чекбокса
  private async setCheckbox(action: IAction): Promise<IActionResult> {
    const checkboxElement = this.findElementByXpath(action.element_xpath as string) as HTMLInputElement;
    if (!checkboxElement) {
      throw new Error('Element not found');
    }

    checkboxElement.checked = this.parseCheckboxValue(action.value);
    return { success: true };
  }

  // Парсинг значения для чекбокса
  private parseCheckboxValue(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
    if (typeof value === 'number') return value !== 0;
    return false;
  }

  // Скроллинг
  private async executeScroll(action: IAction): Promise<IActionResult> {
    const scrollElement = this.findElementByXpath(action.element_xpath as string);
    if (!scrollElement) {
      throw new Error('Element not found');
    }

    scrollElement.scrollIntoView({ behavior: 'smooth' });
    return { success: true };
  }

  // Установка таймаута
  public setTimeout(type: string, value: number): void {
    this.timeouts[type] = value;
  }
}

export default ActionExecutor;
