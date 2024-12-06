// Определение типов для расширения SocketClicker

// Типы действий
export type ActionType = 
  | 'click' 
  | 'input' 
  | 'select' 
  | 'checkbox' 
  | 'scroll' 
  | 'get_text' 
  | 'navigate';

// Интерфейс для действия
export interface IAction {
  action: string;
  element_xpath?: string;
  value?: string | number | boolean;
  selector?: string;
  target?: string;  // Добавляем новое поле
  on_start?: number;
}

// Интерфейс для результата действия
export interface IActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  details?: {
    elementText?: string;
    elementTagName?: string;
    [key: string]: any;
  };
}

// Интерфейс для сложной команды
export interface IComplexCommand {
  type: string;
  params: {
    data: IAction[];
    retry_count?: number;
    retry_delay?: number;
  };
}

// Интерфейс для настроек прокси
export interface IProxySettings {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol?: 'http' | 'https' | 'socks4' | 'socks5';
}

// Интерфейс для конфигурации расширения
export interface IExtensionConfig {
  proxy?: IProxySettings;
  default_timeout?: number;
  debug_mode?: boolean;
}
