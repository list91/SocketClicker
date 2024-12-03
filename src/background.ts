import ActionExecutor from './actions/action_executor';

// Создаем единственный экземпляр ActionExecutor
const actionExecutor = new ActionExecutor();

// Запуск опроса ProxyPilot
actionExecutor.startProxyPilotPolling();

// Устанавливаем интервал проверки команд
chrome.runtime.onInstalled.addListener(() => {
  console.log('SocketClicker background script установлен');
});

// Начальная проверка при старте
actionExecutor.startProxyPilotPolling();
