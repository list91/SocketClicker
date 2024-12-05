import ActionExecutor from './actions/action_executor';
// import { chrome } from 'webextension-polyfill-ts';

// Initialize storage with default value
chrome.storage.local.set({ autoKeyEnabled: true }, () => {
    console.log('Initialized autoKeyEnabled to true');
});

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
