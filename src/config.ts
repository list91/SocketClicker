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

// Конфигурация клавиш
export const KEY_CONFIG = {
    // Клавиша для автонажатия (можно изменить на любую другую)
    AUTO_PRESS_KEY: 'y',
    
    // Интервал автонажатия в миллисекундах
    PRESS_INTERVAL: 2000,
    
    // Получаем информацию о клавише
    ...getKeyInfo('y')
};

// Типы сообщений
export type MessageType = {
    action: 'toggleAutoPress';
    value?: boolean;
    type?: string;
    data?: any;
};
