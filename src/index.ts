import { ActionExecutor } from './actions/action_executor';

const actionExecutor = new ActionExecutor();

// Запускаем периодический опрос ProxyPilot
actionExecutor.startProxyPilotPolling(5000);  // Опрос каждые 5 секунд
