import { ActionType, IAction } from './action_collection';

// Интерфейс для результата выполнения действия
export interface IActionResult {
  success: boolean;        // Успешно ли выполнено действие
  error?: string | null;         // Сообщение об ошибке
  data?: any;            // Дополнительные данные
  value?: any;           // Дополнительное значение
}

// Класс для выполнения действий
export class ActionExecutor {
  private timeouts: { [key: string]: number } = {};
  private variables: { [key: string]: any } = {};

  constructor() {
    // Инициализация таймаутов по умолчанию
    this.timeouts = {
      element: 10000,    // Таймаут ожидания элемента
      page: 30000,       // Таймаут загрузки страницы
      script: 10000,     // Таймаут выполнения скрипта
      download: 30000    // Таймаут загрузки файла
    };
  }

  // Основной метод выполнения действия
  async execute(action: IAction): Promise<IActionResult> {
    try {
      // Если задана задержка перед выполнением
      if (action.on_start) {
        await this.sleep(action.on_start);
      }

      // Выполнение действия в зависимости от типа
      switch (action.action) {
        case ActionType.GO:
          return await this.executeGo(action);
        
        case ActionType.CLICK:
          return await this.executeClick(action);
        
        case ActionType.INPUT:
          return await this.executeInput(action);
        
        case ActionType.WAIT:
          return await this.executeWait(action);
        
        case ActionType.WAIT_FOR_ELEMENT:
          return await this.executeWaitForElement(action);
        
        case ActionType.WAIT_FOR_PAGE_LOAD:
          return await this.executeWaitForPageLoad(action);
        
        case ActionType.SELECT:
          return await this.executeSelect(action);
        
        case ActionType.CHECK:
          return await this.executeCheck(action);
        
        case ActionType.GET_TEXT:
          return await this.executeGetText(action);
        
        case ActionType.SCROLL:
          return await this.executeScroll(action);
        
        case ActionType.EXECUTE_SCRIPT:
          return await this.executeScript(action);
        
        // ... другие действия
        
        default:
          return {
            success: false,
            error: `Unsupported action type: ${action.action}`,
            value: null
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
        value: null
      };
    }
  }

  // Переход по URL
  private async executeGo(action: IAction): Promise<IActionResult> {
    try {
      if (!action.value) {
        return {
          success: false,
          error: 'URL is required for GO action',
          value: null
        };
      }

      // Отправляем сообщение в background script для перехода по URL
      await chrome.runtime.sendMessage({
        type: 'GO',
        url: action.value
      });

      // Ждем загрузки страницы
      await this.waitForPageLoad();

      return { success: true, error: undefined, value: null };
    } catch (error: any) {
      return { success: false, error: error.message || String(error), value: null };
    }
  }

  // Клик по элементу
  private async executeClick(action: IAction): Promise<IActionResult> {
    try {
      if (!action.element_xpath) {
        throw new Error('XPath is required for CLICK action');
      }

      const element = await this.findElement(action.element_xpath);
      if (!element) {
        return {
          success: false,
          error: `Element not found: ${action.element_xpath}`,
          value: null
        };
      }

      // Прокручиваем к элементу
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Ждем небольшую паузу после прокрутки
      await this.sleep(500);

      // Эмулируем наведение мыши
      element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      await this.sleep(100);
      
      // Эмулируем mousedown
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      await this.sleep(100);

      // Эмулируем click
      (element as HTMLElement).click();

      // Эмулируем mouseup
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

      return { success: true, error: undefined, value: null };
    } catch (error: any) {
      return { success: false, error: error.message || String(error), value: null };
    }
  }

  // Ввод текста
  private async executeInput(action: IAction): Promise<IActionResult> {
    try {
      if (!action.element_xpath) {
        throw new Error('XPath is required for INPUT action');
      }
      if (!action.value) {
        throw new Error('Value is required for INPUT action');
      }

      const element = await this.findElement(action.element_xpath) as HTMLInputElement;
      if (!element) {
        throw new Error(`Element not found: ${action.element_xpath}`);
      }

      // Фокус на элементе
      element.focus();
      await this.sleep(100);

      // Очищаем значение
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await this.sleep(100);

      // Вводим новое значение
      element.value = action.value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      return { success: true, error: undefined, value: null };
    } catch (error: any) {
      return { success: false, error: error.message || String(error), value: null };
    }
  }

  // Ожидание
  private async executeWait(action: IAction): Promise<IActionResult> {
    try {
      if (!action.value) {
        throw new Error('Wait time is required for WAIT action');
      }

      const waitTime = parseInt(action.value);
      if (isNaN(waitTime)) {
        throw new Error('Invalid wait time value');
      }

      await this.sleep(waitTime);
      return { success: true, error: undefined, value: null };
    } catch (error: any) {
      return { success: false, error: error.message || String(error), value: null };
    }
  }

  // Ожидание элемента
  private async executeWaitForElement(action: IAction): Promise<IActionResult> {
    try {
      if (!action.element_xpath) {
        throw new Error('XPath is required for WAIT_FOR_ELEMENT action');
      }

      const timeout = action.timeout || this.timeouts.element;
      const element = await this.waitForElement(action.element_xpath, timeout);

      return { 
        success: true,
        error: undefined,
        data: { element },
        value: null
      };
    } catch (error: any) {
      return { success: false, error: error.message || String(error), value: null };
    }
  }

  // Ожидание загрузки страницы
  private async executeWaitForPageLoad(action: IAction): Promise<IActionResult> {
    try {
      const timeout = action.timeout || this.timeouts.page;
      await this.waitForPageLoad(timeout);
      return { success: true, error: undefined, value: null };
    } catch (error: any) {
      return { success: false, error: error.message || String(error), value: null };
    }
  }

  // Выбор опции из select
  private async executeSelect(action: IAction): Promise<IActionResult> {
    try {
      if (!action.element_xpath) {
        throw new Error('XPath is required for SELECT action');
      }
      if (!action.value) {
        throw new Error('Value is required for SELECT action');
      }

      const element = await this.findElement(action.element_xpath) as HTMLSelectElement;
      if (!element) {
        throw new Error(`Element not found: ${action.element_xpath}`);
      }

      element.value = action.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));

      return { success: true, error: undefined, value: null };
    } catch (error: any) {
      return { success: false, error: error.message || String(error), value: null };
    }
  }

  // Установка checkbox
  private async executeCheck(action: IAction): Promise<IActionResult> {
    try {
      if (!action.element_xpath) {
        throw new Error('XPath is required for CHECK action');
      }

      const element = await this.findElement(action.element_xpath) as HTMLInputElement;
      if (!element) {
        throw new Error(`Element not found: ${action.element_xpath}`);
      }

      const shouldBeChecked = action.value === 'true';
      if (element.checked !== shouldBeChecked) {
        element.click();
      }

      return { success: true, error: undefined, value: null };
    } catch (error: any) {
      return { success: false, error: error.message || String(error), value: null };
    }
  }

  // Получение текста элемента
  private async executeGetText(action: IAction): Promise<IActionResult> {
    try {
      if (!action.element_xpath) {
        throw new Error('XPath is required for GET_TEXT action');
      }

      const element = await this.findElement(action.element_xpath);
      if (!element) {
        throw new Error(`Element not found: ${action.element_xpath}`);
      }

      return { 
        success: true,
        error: undefined,
        data: { text: element.textContent?.trim() },
        value: null
      };
    } catch (error: any) {
      return { success: false, error: error.message || String(error), value: null };
    }
  }

  // Прокрутка страницы
  private async executeScroll(action: IAction): Promise<IActionResult> {
    try {
      if (action.element_xpath) {
        // Прокрутка к элементу
        const element = await this.findElement(action.element_xpath);
        if (!element) {
          throw new Error(`Element not found: ${action.element_xpath}`);
        }
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (action.value) {
        // Прокрутка на заданное количество пикселей
        const [x, y] = action.value.split(',').map(Number);
        window.scrollTo({
          left: x || 0,
          top: y || 0,
          behavior: 'smooth'
        });
      } else {
        throw new Error('Either element_xpath or value is required for SCROLL action');
      }

      await this.sleep(500); // Ждем завершения прокрутки
      return { success: true, error: undefined, value: null };
    } catch (error: any) {
      return { success: false, error: error.message || String(error), value: null };
    }
  }

  // Выполнение JavaScript
  private async executeScript(action: IAction): Promise<IActionResult> {
    try {
      if (!action.value) {
        throw new Error('Script is required for EXECUTE_SCRIPT action');
      }

      // Создаем функцию из строки скрипта
      const script = new Function(action.value);
      
      // Выполняем скрипт
      const result = script();

      return { 
        success: true,
        error: undefined,
        data: { result },
        value: null
      };
    } catch (error: any) {
      return { success: false, error: error.message || String(error), value: null };
    }
  }

  // Вспомогательные методы

  // Поиск элемента по XPath
  private async findElement(xpath: string): Promise<Element | null> {
    return new Promise((resolve) => {
      const element = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;

      resolve(element as Element);
    });
  }

  // Ожидание элемента с таймаутом
  private async waitForElement(xpath: string, timeout: number): Promise<Element> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = await this.findElement(xpath);
      if (element) return element;
      await this.sleep(100);
    }

    throw new Error(`Timeout waiting for element: ${xpath}`);
  }

  // Ожидание загрузки страницы
  private async waitForPageLoad(timeout: number = this.timeouts.page): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Page load timeout'));
      }, timeout);

      if (document.readyState === 'complete') {
        clearTimeout(timer);
        resolve();
      } else {
        window.addEventListener('load', () => {
          clearTimeout(timer);
          resolve();
        });
      }
    });
  }

  // Пауза выполнения
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Установка таймаута
  public setTimeout(type: string, value: number): void {
    this.timeouts[type] = value;
  }

  // Получение таймаута
  public getTimeout(type: string): number {
    return this.timeouts[type];
  }

  // Установка переменной
  public setVariable(name: string, value: any): void {
    this.variables[name] = value;
  }

  // Получение переменной
  public getVariable(name: string): any {
    return this.variables[name];
  }
}

export default ActionExecutor;
