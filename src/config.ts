// Функция для получения кодов клавиши
function getKeyInfo(key: string) {
    const upperKey = key.toUpperCase();
    const keyCode = upperKey.charCodeAt(0);
    return {
        key: key.toLowerCase(), // Сама клавиша в нижнем регистре
        upperKey, // Клавиша в верхнем регистре
        keyCode, // Код клавиши
        eventCode: `Key${upperKey}` // Код события
    };
}

// Последовательность клавиш для автонажатия
export const KEY_SEQUENCE = ['y', 'e', 's'];

// Конфигурация клавиш
export const KEY_CONFIG = {
    // Последовательность клавиш для автонажатия
    KEY_SEQUENCE,
    
    // Интервал между нажатиями в последовательности (мс)
    KEY_SEQUENCE_INTERVAL: 100,
    
    // Интервал между повторами всей последовательности (мс)
    SEQUENCE_REPEAT_INTERVAL: 2000,
    
    // Информация о клавишах
    KEYS_INFO: KEY_SEQUENCE.map(getKeyInfo)
};

// Типы сообщений
export type MessageType = {
    action: 'toggleAutoPress';
    value?: boolean;
    type?: string;
    data?: any;
};
