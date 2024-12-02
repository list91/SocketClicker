// Типы действий, доступные в системе
export enum ActionType {
  // Базовые действия браузера
  GO = 'go',                    // Переход по URL
  CLICK = 'click',             // Клик по элементу
  INPUT = 'input',             // Ввод текста
  
  // Действия с окнами
  SWITCH_TAB = 'switchTab',    // Переключение вкладки
  NEW_TAB = 'newTab',          // Открытие новой вкладки
  CLOSE_TAB = 'closeTab',      // Закрытие вкладки
  
  // Действия ожидания
  WAIT = 'wait',               // Ожидание (в мс)
  WAIT_FOR_ELEMENT = 'waitForElement',  // Ожидание появления элемента
  WAIT_FOR_PAGE_LOAD = 'waitForPageLoad', // Ожидание загрузки страницы
  
  // Действия с формами
  SELECT = 'select',           // Выбор опции из select
  CHECK = 'check',            // Установка checkbox
  RADIO = 'radio',            // Выбор radio button
  UPLOAD = 'upload',          // Загрузка файла
  
  // Действия с содержимым
  GET_TEXT = 'getText',        // Получение текста элемента
  GET_ATTRIBUTE = 'getAttribute', // Получение атрибута элемента
  SCROLL = 'scroll',          // Прокрутка страницы
  
  // Действия с буфером обмена
  COPY = 'copy',              // Копирование в буфер
  PASTE = 'paste',            // Вставка из буфера
  
  // Действия с окнами
  ALERT_ACCEPT = 'alertAccept',  // Принять alert
  ALERT_DISMISS = 'alertDismiss', // Отклонить alert
  
  // Действия с cookies
  SET_COOKIE = 'setCookie',    // Установка cookie
  GET_COOKIE = 'getCookie',    // Получение cookie
  DELETE_COOKIE = 'deleteCookie', // Удаление cookie
  
  // Действия с локальным хранилищем
  SET_LOCAL_STORAGE = 'setLocalStorage',  // Установка значения в localStorage
  GET_LOCAL_STORAGE = 'getLocalStorage',  // Получение значения из localStorage
  
  // Действия с сессионным хранилищем  
  SET_SESSION_STORAGE = 'setSessionStorage', // Установка значения в sessionStorage
  GET_SESSION_STORAGE = 'getSessionStorage', // Получение значения из sessionStorage
  
  // Действия с iframe
  SWITCH_FRAME = 'switchFrame',  // Переключение на iframe
  PARENT_FRAME = 'parentFrame',  // Возврат к родительскому фрейму
  
  // Действия с JavaScript
  EXECUTE_SCRIPT = 'executeScript', // Выполнение JavaScript
  
  // Действия с сетью
  NETWORK_WAIT = 'networkWait',  // Ожидание сетевого запроса
  BLOCK_URLS = 'blockUrls',      // Блокировка URL
  
  // Действия с окном браузера
  SET_WINDOW_SIZE = 'setWindowSize',  // Установка размера окна
  MAXIMIZE_WINDOW = 'maximizeWindow', // Максимизация окна
  MINIMIZE_WINDOW = 'minimizeWindow', // Минимизация окна
  
  // Действия с мышью
  MOUSE_HOVER = 'mouseHover',    // Наведение мыши
  MOUSE_DOWN = 'mouseDown',      // Нажатие кнопки мыши
  MOUSE_UP = 'mouseUp',          // Отпускание кнопки мыши
  MOUSE_MOVE = 'mouseMove',      // Перемещение мыши
  
  // Действия с клавиатурой
  KEY_DOWN = 'keyDown',          // Нажатие клавиши
  KEY_UP = 'keyUp',              // Отпускание клавиши
  KEY_PRESS = 'keyPress',        // Нажатие и отпускание клавиши
  
  // Действия с drag and drop
  DRAG_AND_DROP = 'dragAndDrop', // Перетаскивание элемента
  
  // Действия со скриншотами
  TAKE_SCREENSHOT = 'takeScreenshot', // Создание скриншота
  
  // Действия с геолокацией
  SET_GEOLOCATION = 'setGeolocation', // Установка геолокации
  
  // Действия с медиа
  MEDIA_PLAY = 'mediaPlay',      // Воспроизведение медиа
  MEDIA_PAUSE = 'mediaPause',    // Пауза медиа
  MEDIA_STOP = 'mediaStop',      // Остановка медиа
  
  // Действия с базой данных
  DB_QUERY = 'dbQuery',          // Выполнение запроса к БД
  
  // Действия с файловой системой
  FILE_READ = 'fileRead',        // Чтение файла
  FILE_WRITE = 'fileWrite',      // Запись в файл
  FILE_DELETE = 'fileDelete',    // Удаление файла
  
  // Действия с системным буфером обмена
  CLIPBOARD_READ = 'clipboardRead',  // Чтение из буфера обмена
  CLIPBOARD_WRITE = 'clipboardWrite' // Запись в буфер обмена
}

// Интерфейс базового действия
export interface IAction {
  action: ActionType;          // Тип действия
  element_xpath?: string;      // XPath элемента (для действий с элементами)
  value?: string;             // Значение (для input, select и др.)
  on_start?: number;          // Задержка перед выполнением действия (мс)
  timeout?: number;           // Таймаут ожидания (мс)
  options?: Record<string, any>; // Дополнительные опции
}

// Интерфейс коллекции действий
export interface IActionCollection {
  id: string;                 // Уникальный идентификатор коллекции
  name: string;               // Название коллекции
  description?: string;       // Описание коллекции
  created_at: number;         // Время создания (timestamp)
  updated_at: number;         // Время последнего обновления (timestamp)
  actions: IAction[];         // Список действий
  variables?: {               // Переменные коллекции
    [key: string]: string | number | boolean;
  };
  options?: {                 // Опции выполнения
    stopOnError?: boolean;    // Остановка при ошибке
    timeout?: number;         // Общий таймаут выполнения
    retries?: number;         // Количество попыток
    interval?: number;        // Интервал между попытками
  };
}

// Класс для работы с коллекциями действий
export class ActionCollection implements IActionCollection {
  public id: string;
  public name: string;
  public description?: string;
  public created_at: number;
  public updated_at: number;
  public actions: IAction[];
  public variables?: { [key: string]: string | number | boolean };
  public options?: {
    stopOnError?: boolean;
    timeout?: number;
    retries?: number;
    interval?: number;
  };

  constructor(data: Partial<IActionCollection>) {
    this.id = data.id || crypto.randomUUID();
    this.name = data.name || 'Untitled Collection';
    this.description = data.description;
    this.created_at = data.created_at || Date.now();
    this.updated_at = data.updated_at || Date.now();
    this.actions = data.actions || [];
    this.variables = data.variables;
    this.options = data.options;
  }

  // Добавить действие в коллекцию
  addAction(action: IAction): void {
    this.actions.push(action);
    this.updated_at = Date.now();
  }

  // Удалить действие из коллекции
  removeAction(index: number): void {
    if (index >= 0 && index < this.actions.length) {
      this.actions.splice(index, 1);
      this.updated_at = Date.now();
    }
  }

  // Обновить действие в коллекции
  updateAction(index: number, action: Partial<IAction>): void {
    if (index >= 0 && index < this.actions.length) {
      this.actions[index] = { ...this.actions[index], ...action };
      this.updated_at = Date.now();
    }
  }

  // Установить переменную
  setVariable(key: string, value: string | number | boolean): void {
    if (!this.variables) this.variables = {};
    this.variables[key] = value;
    this.updated_at = Date.now();
  }

  // Получить переменную
  getVariable(key: string): string | number | boolean | undefined {
    return this.variables?.[key];
  }

  // Экспорт коллекции в JSON
  toJSON(): string {
    return JSON.stringify({
      id: this.id,
      name: this.name,
      description: this.description,
      created_at: this.created_at,
      updated_at: this.updated_at,
      actions: this.actions,
      variables: this.variables,
      options: this.options
    }, null, 2);
  }

  // Импорт коллекции из JSON
  static fromJSON(json: string): ActionCollection {
    const data = JSON.parse(json);
    return new ActionCollection(data);
  }
}
