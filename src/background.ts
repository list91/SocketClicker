import { checkQueueStatus } from './queueChecker';

// Запускаем первую проверку сразу
checkQueueStatus();

// Устанавливаем интервал проверки каждые 3 секунды
setInterval(checkQueueStatus, 2000);