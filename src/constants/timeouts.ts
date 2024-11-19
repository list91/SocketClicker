/**
 * Константы времени ожидания для различных операций
 */
export const TIMEOUTS = {
    // Общие таймауты
    DEFAULT: {
        timeout: 10000,    // 10 секунд
        interval: 500      // 0.5 секунды
    },
    
    // Таймауты для публикации
    PUBLICATION: {
        // Ожидание загрузки формы публикации
        TEXT_INPUT: {
            timeout: 15000,    // 15 секунд
            interval: 500
        },
        // Ожидание кнопки публикации
        PUBLISH_BUTTON: {
            timeout: 5000,     // 5 секунд
            interval: 300
        },
        // Ожидание подтверждения публикации
        SUBMIT_BUTTON: {
            timeout: 20000,    // 20 секунд
            interval: 1000
        }
    },

    // Таймауты для кликов
    CLICK: {
        timeout: 8000,     // 8 секунд
        interval: 300
    },

    // Таймауты для ввода
    INPUT: {
        timeout: 5000,     // 5 секунд
        interval: 300
    }
};
