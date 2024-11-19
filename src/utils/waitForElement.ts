/**
 * Конфигурация ожидания элемента
 */
export interface WaitConfig {
    /** Максимальное время ожидания в миллисекундах */
    timeout?: number;
    /** Интервал между попытками в миллисекундах */
    interval?: number;
    /** Сообщение об ошибке при превышении времени ожидания */
    errorMessage?: string;
}

/**
 * Стандартные значения конфигурации
 */
const DEFAULT_CONFIG: Required<WaitConfig> = {
    timeout: 10000, // 10 секунд
    interval: 500,  // 0.5 секунды
    errorMessage: 'Элемент не найден в течение отведенного времени'
};

/**
 * Ожидает появления элемента по XPath
 * @param xpath XPath селектор элемента
 * @param config конфигурация ожидания
 * @returns найденный элемент
 * @throws Error если элемент не найден за отведенное время
 */
export async function waitForElement(
    xpath: string, 
    config: WaitConfig = {}
): Promise<Element> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const startTime = Date.now();

    while (Date.now() - startTime < finalConfig.timeout) {
        const element = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;

        if (element) {
            return element as Element;
        }

        await new Promise(resolve => setTimeout(resolve, finalConfig.interval));
    }

    throw new Error(finalConfig.errorMessage);
}

/**
 * Ожидает возможности взаимодействия с элементом
 * @param element элемент для проверки
 * @param config конфигурация ожидания
 * @returns true если элемент доступен для взаимодействия
 * @throws Error если элемент не стал доступным за отведенное время
 */
export async function waitForElementToBeInteractive(
    element: Element,
    config: WaitConfig = {}
): Promise<boolean> {
    const finalConfig = { 
        ...DEFAULT_CONFIG,
        errorMessage: 'Элемент не стал доступным для взаимодействия',
        ...config 
    };
    const startTime = Date.now();

    while (Date.now() - startTime < finalConfig.timeout) {
        const rect = element.getBoundingClientRect();
        const isVisible = !!(
            rect.top || rect.bottom || rect.width || rect.height
        );
        
        if (isVisible && 
            !element.hasAttribute('disabled') && 
            window.getComputedStyle(element).display !== 'none' &&
            window.getComputedStyle(element).visibility !== 'hidden') {
            return true;
        }

        await new Promise(resolve => setTimeout(resolve, finalConfig.interval));
    }

    throw new Error(finalConfig.errorMessage);
}
