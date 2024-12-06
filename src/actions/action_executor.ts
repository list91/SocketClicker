import { IAction, IActionResult, ActionType, IComplexCommand } from '../types';
import { WebInteractions } from './web_interactions';

// Класс для выполнения действий
export class ActionExecutor {
  private timeouts: { [key: string]: number };
  private variables: { [key: string]: any };
  private currentTabId: number | null = null;  // Инициализация значением null
  private proxyPilotUrl: string = 'http://127.0.0.1:5000';

  constructor() {
    this.timeouts = {};
    this.variables = {};

    // Получаем текущий активный таб при инициализации
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        this.currentTabId = tabs[0].id;
      }
    });
  }

  // Метод для обновления текущего таба
  private async updateCurrentTab(): Promise<void> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          this.currentTabId = tabs[0].id;
        }
        resolve();
      });
    });
  }

  // Безопасное получение элемента по XPath с улучшенной типизацией
  private async findElementByXpath(xpath: string): Promise<boolean> {
    if (!xpath) {
      console.error('❌ Пустой XPath');
      return false;
    }

    try {
      // Обновляем текущий таб перед выполнением
      await this.updateCurrentTab();

      const result = await chrome.scripting.executeScript({
        target: { tabId: this.currentTabId as number },
        func: (elementXpath: string) => {
          const element = document.evaluate(
            elementXpath, 
            document, 
            null, 
            XPathResult.FIRST_ORDERED_NODE_TYPE, 
            null
          ).singleNodeValue;

          return !!element;
        },
        args: [xpath]
      });

      return result[0]?.result || false;
    } catch (error) {
      console.error('❌ Ошибка поиска элемента по XPath:', error);
      return false;
    }
  }

  // Выполнение действия с улучшенной типизацией
  public async execute(action: IAction): Promise<IActionResult> {
    // Проверка наличия обязательных параметров
    if (!action.action) {
      return { 
        success: false, 
        error: 'Отсутствует тип действия',
        message: 'Не указан тип действия для выполнения'
      };
    }

    try {
      // Выполнение задержки перед действием, если указано
      if (action.on_start) {
        await this.sleep(action.on_start);
      }

      switch (action.action) {
        case 'click':
          return await this.executeClick(action);
        case 'input':
          return await this.executeInput(action);
        case 'select':
          return await this.executeSelect(action);
        case 'checkbox':
          return await this.setCheckbox(action);
        case 'scroll':
          return await this.executeScroll(action);
        case 'get_text':
          return await this.executeGetText(action);
        case 'go':
          return await this.executeGo(action);
        default:
          return { 
            success: false, 
            error: `Неизвестный тип действия: ${action.action}`,
            message: `Неизвестный тип действия: ${action.action}`
          };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }

  // Выполнение сложной команды
  public async executeComplexCommand(command: IComplexCommand): Promise<IActionResult[]> {
    if (!command || !command.params || !Array.isArray(command.params.data)) {
      return [{
        success: false,
        error: 'Некорректный формат сложной команды',
        message: 'Некорректный формат сложной команды'
      }];
    }

    const results: IActionResult[] = [];
    let retryCount = command.params.retry_count || 0;
    const retryDelay = command.params.retry_delay || 1000;

    while (retryCount >= 0) {
      try {
        for (const action of command.params.data) {
          const result = await this.execute(action);
          results.push(result);

          if (!result.success) {
            throw new Error(`Ошибка выполнения действия: ${result.error}`);
          }
        }
        break; // Успешное выполнение всех действий
      } catch (error) {
        if (retryCount === 0) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Неизвестная ошибка',
            message: 'Не удалось выполнить сложную команду'
          });
          break;
        }
        
        // Ожидание перед повторной попыткой
        await this.sleep(retryDelay);
        retryCount--;
      }
    }

    return results;
  }

  // Приватные методы выполнения действий...
  private validateActionParameters(action: IAction): void {
    if (!action.action) {
      throw new Error('Тип действия не указан');
    }

    switch (action.action) {
      case 'go':
        if (!action.value || typeof action.value !== 'string') {
          throw new Error('Некорректный URL');
        }
        break;
      case 'click':
      case 'input':
      case 'get_text':
        if (!action.element_xpath || typeof action.element_xpath !== 'string') {
          throw new Error('Некорректный XPath');
        }
        if (action.action === 'input' && (!action.value || typeof action.value !== 'string')) {
          throw new Error('Некорректное значение для ввода');
        }
        break;
      case 'select':
      case 'checkbox':
      case 'scroll':
        // Дополнительные проверки для этих типов действий
        break;
      default:
        throw new Error(`Неподдерживаемый тип действия: ${action.action}`)
    }
  }

  // Приватный метод для задержки
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Методы выполнения конкретных действий
  private async executeClick(action: IAction): Promise<IActionResult> {
    const result: IActionResult = {
        success: false,
        message: 'Click not executed'
    };

    // Используем element_xpath или target, если они есть
    const selector = action.element_xpath || action.target;
    if (!selector) {
        result.message = 'No selector or target provided for click';
        return result;
    }

    try {
        const scriptResults = await chrome.scripting.executeScript({
            target: { tabId: this.currentTabId as number },
            func: (selector: string) => {
                // Расширенный поиск элемента с несколькими стратегиями
                const findElement = (selector: string): HTMLElement | null => {
                    // Попытка найти по XPath
                    const xpathResult = document.evaluate(
                        selector, 
                        document, 
                        null, 
                        XPathResult.FIRST_ORDERED_NODE_TYPE, 
                        null
                    ).singleNodeValue as HTMLElement;

                    if (xpathResult) return xpathResult;

                    // Попытка найти по CSS селектору
                    const cssElement = document.querySelector(selector);
                    if (cssElement instanceof HTMLElement) return cssElement;

                    // Попытка найти по тексту
                    const elementByText = Array.from(document.querySelectorAll('*'))
                        .find(el => el.textContent?.trim() === selector) as HTMLElement;
                    
                    return elementByText || null;
                };

                const element = findElement(selector);

                if (!element) {
                    return { 
                        found: false, 
                        message: `Element not found: ${selector}`,
                        searchStrategies: ['XPath', 'CSS Selector', 'Text Match']
                    };
                }

                // Расширенная проверка видимости с диагностикой
                const checkVisibility = (el: HTMLElement) => {
                    const style = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();

                    return {
                        isVisible: 
                            style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            rect.top >= 0 &&
                            rect.left >= 0 &&
                            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                            rect.right <= (window.innerWidth || document.documentElement.clientWidth),
                        opacity: parseFloat(style.opacity),
                        displayStyle: style.display,
                        visibilityStyle: style.visibility,
                        boundingRect: {
                            top: rect.top,
                            left: rect.left,
                            bottom: rect.bottom,
                            right: rect.right,
                            width: rect.width,
                            height: rect.height
                        }
                    };
                };

                const visibilityInfo = checkVisibility(element);

                // Улучшенный скроллинг с опциональным поведением
                if (!visibilityInfo.isVisible) {
                    try {
                        element.scrollIntoView({ 
                            block: 'center', 
                            behavior: 'smooth',
                            inline: 'nearest'
                        });
                    } catch (scrollError) {
                        console.warn('Scroll failed', scrollError);
                    }
                }

                // Расширенная диспетчеризация событий
                const dispatchClickEvents = (target: HTMLElement) => {
                    const events = [
                        new MouseEvent('mouseover', { bubbles: true, cancelable: true }),
                        new MouseEvent('mouseenter', { bubbles: false, cancelable: true }),
                        new MouseEvent('mousemove', { bubbles: true, cancelable: true }),
                        new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
                        new MouseEvent('click', { bubbles: true, cancelable: true }),
                        new MouseEvent('mouseup', { bubbles: true, cancelable: true })
                    ];

                    events.forEach(event => target.dispatchEvent(event));

                    // Специальная логика для инпутов
                    if (target instanceof HTMLInputElement || 
                        target instanceof HTMLTextAreaElement || 
                        target.isContentEditable) {
                        target.focus();  // Устанавливаем фокус
                        
                        // Создаем события фокуса
                        const focusEvents = [
                            new FocusEvent('focus', { bubbles: true, cancelable: true }),
                            new Event('focusin', { bubbles: true, cancelable: true }),
                            new Event('select', { bubbles: true, cancelable: true })
                        ];

                        focusEvents.forEach(event => target.dispatchEvent(event));

                        // Имитируем мигание курсора
                        target.style.caretColor = 'black';
                        setTimeout(() => {
                            target.style.caretColor = 'transparent';
                            setTimeout(() => {
                                target.style.caretColor = 'black';
                            }, 500);
                        }, 500);
                    }
                };

                dispatchClickEvents(element);

                return { 
                    found: true, 
                    elementText: element.textContent?.trim() || '',
                    elementTagName: element.tagName,
                    visibilityDetails: visibilityInfo,
                    attributes: Array.from(element.attributes).map(attr => ({
                        name: attr.name,
                        value: attr.value
                    }))
                };
            },
            args: [selector]
        });

        const clickResult = scriptResults[0]?.result;

        if (clickResult?.found) {
            result.success = true;
            result.message = 'Click successful';
            result.details = {
                elementText: clickResult.elementText,
                elementTagName: clickResult.elementTagName,
                visibilityDetails: clickResult.visibilityDetails,
                attributes: clickResult.attributes
            };
        } else {
            result.message = clickResult?.message || 'Element not found';
        }
    } catch (error) {
        result.message = `Click execution error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.error = error instanceof Error ? error.toString() : 'Unknown error';
    }

    return result;
  }

  private async executeInput(action: IAction): Promise<IActionResult> {
    console.log(`🔍 Начало выполнения input. XPath: ${action.element_xpath}`);
    console.log(`📥 Значение для ввода: ${action.value}`);

    // Проверка наличия XPath
    if (!action.element_xpath) {
      console.error('❌ Отсутствует XPath элемента');
      return { 
        success: false, 
        error: 'Отсутствует XPath элемента', 
        message: 'Не указан XPath для ввода' 
      };
    }

    // Преобразование значения к строке с безопасной обработкой
    const inputValue = action.value !== undefined 
      ? String(action.value) 
      : '';

    console.log(`🔎 Поиск элемента по XPath: ${action.element_xpath}`);
    const element = await this.findElementByXpath(action.element_xpath);
    
    if (!element) {
      console.error(`❌ Элемент не найден по XPath: ${action.element_xpath}`);
      return { 
        success: false, 
        error: 'Элемент не найден', 
        message: 'Не удалось найти элемент для ввода' 
      };
    }

    console.log(`✅ Элемент найден по XPath: ${action.element_xpath}`);

    try {
      // Выполнение ввода текста
      const result = await chrome.scripting.executeScript({
        target: { tabId: this.currentTabId as number },
        func: (elementXpath: string, value: string) => {
          const element = document.evaluate(
            elementXpath, 
            document, 
            null, 
            XPathResult.FIRST_ORDERED_NODE_TYPE, 
            null
          ).singleNodeValue as HTMLInputElement;

          if (element) {
            console.log('📝 Найден элемент для ввода');
            try {
              element.value = value;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
              console.log(`✅ Успешно введено значение: ${value}`);
              return true;
            } catch (error) {
              console.error('❌ Ошибка при вводе значения:', error);
              return false;
            }
          }
          console.error('❌ Элемент не найден при выполнении скрипта');
          return false;
        },
        args: [action.element_xpath, inputValue]
      });

      // Небольшая задержка для обработки события
      await this.sleep(100);

      const scriptResult = result[0]?.result;
      
      return { 
        success: scriptResult === true, 
        message: scriptResult === true 
          ? `Введено значение: ${inputValue}` 
          : 'Не удалось ввести значение',
        data: {
          xpath: action.element_xpath,
          value: inputValue,
          elementFound: scriptResult === true
        }
      };
    } catch (error) {
      console.error('🚨 Критическая ошибка при вводе:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ошибка ввода', 
        message: 'Не удалось выполнить ввод текста',
        data: {
          xpath: action.element_xpath,
          value: inputValue,
          elementFound: false
        }
      };
    }
  }

  private async executeSelect(action: IAction): Promise<IActionResult> {
    const element = await this.findElementByXpath(action.element_xpath || '');
    if (!element) {
      return { 
        success: false, 
        error: 'Элемент не найден', 
        message: 'Не удалось найти элемент для выбора' 
      };
    }
    // Реализация выбора
    return { success: true, message: 'Выбор выполнен' };
  }

  private async setCheckbox(action: IAction): Promise<IActionResult> {
    const element = await this.findElementByXpath(action.element_xpath || '');
    if (!element) {
      return { 
        success: false, 
        error: 'Элемент не найден', 
        message: 'Не удалось найти чекбокс' 
      };
    }
    // Реализация работы с чекбоксом
    return { success: true, message: 'Чекбокс установлен' };
  }

  private async executeScroll(action: IAction): Promise<IActionResult> {
    console.log(`📜 Выполнение скролла. Значение: ${action.value}`);

    if (action.value === undefined) {
      console.error('❌ Отсутствует значение для скролла');
      return {
        success: false,
        error: 'Отсутствует значение скролла',
        message: 'Не указано значение для скролла'
      };
    }

    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: this.currentTabId as number },
        func: (scrollValue: number) => {
          try {
            // Выполнение скролла
            window.scrollBy(0, scrollValue);
            console.log(`📍 Скролл на ${scrollValue} пикселей`);
            return true;
          } catch (error) {
            console.error('❌ Ошибка при скролле:', error);
            return false;
          }
        },
        args: [Number(action.value)]
      });

      const scrollResult = result[0]?.result;
      
      return {
        success: scrollResult === true,
        message: scrollResult === true 
          ? `Скролл на ${action.value} пикселей` 
          : 'Не удалось выполнить скролл',
        data: {
          scrollValue: action.value
        }
      };
    } catch (error) {
      console.error('🚨 Ошибка при выполнении скролла:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка скролла',
        message: 'Не удалось выполнить скролл'
      };
    }
  }

  private async executeGetText(action: IAction): Promise<IActionResult> {
    const element = await this.findElementByXpath(action.element_xpath || '');
    if (!element) {
      return { 
        success: false, 
        error: 'Элемент не найден', 
        message: 'Не удалось найти элемент для получения текста' 
      };
    }
    // Реализация получения текста
    return { success: true, message: 'Текст получен' };
  }

  private async executeGo(action: IAction): Promise<IActionResult> {
    console.log(`🌐 Переход по URL: ${action.value}`);

    if (!action.value || typeof action.value !== 'string') {
      console.error('❌ Некорректный URL');
      return {
        success: false,
        error: 'Некорректный URL',
        message: 'Не указан или неверный формат URL'
      };
    }

    try {
      // Получаем текущую активную вкладку
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        console.error('❌ Не удалось найти активную вкладку');
        return {
          success: false,
          error: 'Вкладка не найдена',
          message: 'Не удалось найти активную вкладку для перехода'
        };
      }

      // Обновляем вкладку
      await chrome.tabs.update(tab.id, { url: action.value });

      // Небольшая задержка для загрузки страницы
      await this.sleep(1000);

      console.log(`✅ Успешный переход на ${action.value}`);
      return {
        success: true,
        message: `Переход на ${action.value}`,
        data: {
          url: action.value
        }
      };
    } catch (error) {
      console.error('🚨 Ошибка при переходе:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка перехода',
        message: 'Не удалось выполнить переход по URL'
      };
    }
  }

  // Выполнение действия startAutoPress
  private async executeStartAutoPress(action: IAction): Promise<IActionResult> {
    console.log(`⌨️ Выполнение посимвольного ввода текста: ${action.value}`);
    
    try {
      // const symbols = []
      // Обновляем текущий таб перед выполнением
      
      await this.updateCurrentTab();
      
      if (!this.currentTabId) {
        throw new Error('Не найдена активная вкладка');
      }
      
      if (!action.value) {
        throw new Error('Некорректный текст для ввода');
      }
      if (typeof action.value === 'string'){
        const symbols = action.value.split('').map(s => s.toString());
        console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",symbols)
        const result = await WebInteractions.startAutoPress(this.currentTabId, symbols || []);
      } else {
        throw new Error('Некорректный текст для ввода');
      }
      
      // if (!result.success) {
      //   throw new Error(result.message || 'Ошибка при вводе текста');
      // }

      return {
        success: true,
        message: 'Текст успешно введен'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        message: 'Ошибка при вводе текста'
      };
    }
  }

  /**
   * Опрос ProxyPilot на наличие новых команд
   * @returns Promise с информацией о команде или null
   */
  private async checkProxyPilotCommands(): Promise<void> {
    console.log('🕒 Проверка команд ProxyPilot');
    
    try {
      const response = await this.fetchProxyPilotCommands();
      
      if (!response) {
        console.log('❌ Пустой ответ от ProxyPilot');
        return;
      }

      console.log('📦 Полученный текст:', JSON.stringify(response, null, 2));

      // Проверка структуры команды
      if (!this.isValidCommand(response)) {
        console.error('❌ Некорректная структура команды:', response);
        return;
      }

      console.log(`🔍 Получена команда от ProxyPilot: ${JSON.stringify(response)}`);

      // Выполнение команды
      const commandResult = await this.executeCommand(response);
      
      console.log('📊 Результат выполнения команды:', JSON.stringify(commandResult, null, 2));

      // Отправка результата обратно в ProxyPilot
      await this.sendCommandResult(response.id, commandResult);

    } catch (error) {
      console.error('🚨 Ошибка при проверке команд ProxyPilot:', error);
    }
  }

  // Валидация структуры команды
  private isValidCommand(command: any): boolean {
    console.log('🕵️ Проверка валидности команды');
    
    if (!command) {
      console.error('❌ Команда пуста');
      return false;
    }

    const requiredFields = ['command', 'id', 'params', 'time_created'];
    for (const field of requiredFields) {
      if (!(field in command)) {
        console.error(`❌ Отсутствует обязательное поле: ${field}`);
        return false;
      }
    }

    if (!command.params || !command.params.data) {
      console.error('❌ Некорректные параметры команды');
      return false;
    }

    for (const action of command.params.data) {
      if (!action.action) {
        console.error('❌ Отсутствует тип действия');
        return false;
      }
    }

    console.log('✅ Команда прошла валидацию');
    return true;
  }

  // Отправка результата команды обратно в ProxyPilot
  private async sendCommandResult(commandId: string, result: IActionResult): Promise<void> {
    console.log('📤 Отправка результата команды в ProxyPilot');
    
    try {
      const response = await fetch(`${this.proxyPilotUrl}/command_result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command_id: commandId,
          result: result
        })
      });

      if (!response.ok) {
        console.error(`❌ Ошибка отправки результата: ${response.status}`);
      } else {
        console.log('✅ Результат команды успешно отправлен');
      }
    } catch (error) {
      console.error('🚨 Ошибка при отправке результата команды:', error);
    }
  }

  // Запрос команды от ProxyPilot
  private async fetchProxyPilotCommands(): Promise<any> {
    try {
      const response = await fetch(`${this.proxyPilotUrl}/get_command`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`❌ Ошибка запроса команды: ${response.status}`);
        return null;
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        console.log('🕐 Нет новых команд от ProxyPilot');
        return null;
      }

      let commandData;
      try {
        commandData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Ошибка парсинга JSON:', parseError);
        console.log('❌ Проблемный текст:', responseText);
        return null;
      }
      
      return commandData;
    } catch (error) {
      console.error('🚨 Критическая ошибка при запросе команды:', error);
      return null;
    }
  }

  // Выполнение команды
  private async executeCommand(command: any): Promise<IActionResult> {
    console.log(`🚀 Выполнение команды: ${command.command}`);
    console.log(`🆔 ID команды: ${command.id}`);
    console.log(`📋 Параметры команды:`, JSON.stringify(command.params, null, 2));

    // Проверка текущей активной вкладки
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length || !tabs[0].id) {
      console.error('❌ Нет активной вкладки');
      return {
        success: false,
        error: 'Нет активной вкладки',
        message: 'Не удалось найти активную вкладку для выполнения команд'
      };
    }
    this.currentTabId = tabs[0].id;
    console.log(`🌟 Текущая активная вкладка: ${this.currentTabId}`);

    if (!command.params || !command.params.data) {
      console.error('❌ Отсутствуют параметры или данные команды');
      return {
        success: false,
        error: 'Некорректные параметры команды',
        message: 'Не указаны параметры или данные для выполнения'
      };
    }

    const actions = command.params.data;
    console.log(`🔢 Количество действий: ${actions.length}`);

    const results: IActionResult[] = [];

    for (const action of actions) {
      console.log(`🔍 Выполнение действия: ${JSON.stringify(action)}`);
      
      try {
        let result: IActionResult;
        switch (action.action) {
          case 'input':
            result = await this.executeInput(action);
            break;
          case 'click':
            result = await this.executeClick(action);
            break;
          case 'scroll':
            result = await this.executeScroll(action);
            break;
          case 'go':
            result = await this.executeGo(action);
            break;
          case 'startAutoPress':
            result = await this.executeStartAutoPress(action);
            break;
          default:
            console.warn(`⚠️ Неизвестное действие: ${action.action}`);
            result = {
              success: false,
              error: 'Неподдерживаемое действие',
              message: `Действие ${action.action} не поддерживается`
            };
        }

        console.log(`📊 Результат действия:`, JSON.stringify(result, null, 2));
        results.push(result);

        // Небольшая задержка между действиями
        await this.sleep(500);

        // Остановка выполнения если действие не удалось
        if (!result.success) {
          console.error(`❌ Ошибка при выполнении действия: ${action.action}`);
          break;
        }
      } catch (error) {
        console.error(`🚨 Критическая ошибка при выполнении действия:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка',
          message: `Ошибка при выполнении действия ${action.action}`
        });
        break;
      }
    }

    // Определение общего результата
    const overallSuccess = results.every(result => result.success);
    
    return {
      success: overallSuccess,
      message: overallSuccess 
        ? 'Все действия выполнены успешно' 
        : 'Не все действия выполнены',
      data: {
        commandId: command.id,
        actionResults: results
      }
    };
  }

  /**
   * Запуск периодического опроса ProxyPilot
   * @param intervalMs Интервал опроса в миллисекундах
   */
  startProxyPilotPolling(intervalMs: number = 5000): void {
    const pollProxyPilot = async () => {
      try {
        await this.checkProxyPilotCommands();
      } catch (error) {
        console.error('Ошибка при опросе ProxyPilot:', error);
      }
    };

    // Запускаем первый опрос немедленно
    pollProxyPilot();

    // Устанавливаем интервальный опрос
    setInterval(pollProxyPilot, intervalMs);
  }
}

export default ActionExecutor;
