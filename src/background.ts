// // // Функция для получения текущей вкладки
// // async function getCurrentTabId(): Promise<number> {
// //   const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
// //   if (tabs.length === 0) {
// //       throw new Error('Нет активных вкладок');
// //   }
// //   return tabs[0].id!;
// // }

// // // Функция для получения последних команд от Proxy Pilot
// // async function fetchLatestCommands() {
// //     try {
// //         const response = await fetch('http://127.0.0.1:5000/get_latest_commands'); // Эндпоинт для получения команд
// //         if (!response.ok) {
// //             throw new Error('Ошибка при получении команд');
// //         }
// //         const data = await response.json();
//         // console.log('Полученные команды:', data); // Логируем полученные данные
// //         return data.new_commands.flatMap(command => command.actions) || []; // Извлекаем массив действий
// //     } catch (error) {
// //         console.error('Ошибка при запросе последних команд:', error);
// //         return [];
// //     }
// // }

// // // Функция для выполнения действий
// // async function executeActions(actions: any[]) {
// //     for (const action of actions) {
// //         try {
// //             const tabId = await getCurrentTabId(); // Получаем ID текущей вкладки
// //             await chrome.scripting.executeScript({
// //                 target: { tabId: tabId },
// //                 func: new Function(action.func) // Создаем новую функцию из строки
// //             });
// //         } catch (error) {
// //             console.error(`Ошибка при выполнении действия ${action.name}:`, error);
// //         }
// //     }
// // }

// // import { postMessage } from '../RPA/src/common/ipc/cs_postmessage';
// // import { insertScript } from '../RPA/src/common/utils';
// // import { retry } from '../RPA/src/common/ts_utils';
// // import config from '../RPA/src/config';

// // export function untilInjected(minTimeout: number = config.executeScript.minimumTimeout): Promise<EvalAPI> {
// //     const api: EvalAPI = {
// //         eval: (code) => {
//             // console.log('sending INJECT_RUN_EVAL');
// //             return postMessage(window, window, { cmd: 'INJECT_RUN_EVAL', args: { code } }, '*', minTimeout)
// //                 .then((data) => {
//                     // console.log('eval result', data);
// //                     return (data as { result: unknown }).result;
// //                 });
// //         }
// //     };
// //     const injected = !!document.body.getAttribute('data-injected');

// //     if (injected) {
// //         return Promise.resolve(api);
// //     }

// //     insertScript(Ext.runtime.getURL('inject.js'));

// //     return retry(() => {
//         // console.log('sending INJECT_READY');
// //         return postMessage(window, window, { cmd: 'INJECT_READY' }, '*', 500);
// //     }, {
// //         shouldRetry: () => true,
// //         timeout: 5000,
// //         retryInterval: 0
// //     })()
// //     .then(() => api)
// //     .catch(e => {
// //         console.error(e.stack);
// //         throw new Error('fail to inject');
// //     });
// // }

// // /**
// //  * Выполняет переданный JavaScript-код в контексте страницы.
// //  * @param code - Строка с JavaScript-кодом для выполнения.
// //  * @returns Promise, который разрешается с результатом выполнения кода.
// //  */
// // export async function executeJavaScript(code: string): Promise<any> {
// //     const api = await untilInjected();
//     // console.log('Executing JavaScript code:', code);
// //     return api.eval(code);
// // }

// // const actions = [
// //     {
// //         "name": "go ...",
// //         "func": "alert(1);"
// //         // "func": "window.location.href = 'https://ru.wikipedia.org/wiki/%D0%97%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F_%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%B8%D1%86%D0%B0';"
// //     }
// // ]

// // // Функция для периодического выполнения действий
// // async function periodicExecution() {
// //     while (true) {
// //         // const actions = await fetchLatestCommands(); // Получаем последние команды
// //         await executeActions(actions); // Выполняем действия
// //         await new Promise(resolve => setTimeout(resolve, 5000)); // Ждем 3 секунды
// //     }
// // }

// // // Запускаем периодическое выполнение действий
// // // periodicExecution();

// // setInterval(() => { 
// //     (async () => {
// //         const api = await untilInjected();
// //         api.eval('alert(1)')
// //     })()
// //  }, 5000);

// // import { postMessage } from "./cs_postmessage"
// // import  Ext  from "./web_extension"
// // import config from "./config"

// // export const delay = (fn: Function, timeout: number): Promise<any> => {
// //     return new Promise((resolve: Function, reject: Function) => {
// //       setTimeout(() => {
// //         try {
// //           resolve(fn())
// //         } catch (e) {
// //           reject(e)
// //         }
// //       }, timeout)
// //     })
// //   }
// // export const insertScript = (file) => {
// //     const s = document.constructor.prototype.createElement.call(document, 'script')
  
// //     s.setAttribute('type', 'text/javascript')
// //     s.setAttribute('src', file)
  
// //     document.documentElement.appendChild(s)
// //     s.parentNode.removeChild(s)
// //   }
// //   export type RetryOptions = {
// //     timeout?:       number,
// //     retryInterval?: number | RetryIntervalFactory,
// //     onFirstFail?:   Function,
// //     onFinal?:       Function,
// //     shouldRetry?:   (e: Error) => boolean | Promise<boolean>,
// //   }
// //   export type RetryIntervalFactory = (retryCount: number, lastInterval: number) => number
// //   export type PromiseFunction<T, ArgsType extends any[] = any[]> = (...args: ArgsType) => Promise<T>
// //   export const retry = <T>(fn: PromiseFunction<T>, options: RetryOptions): PromiseFunction<T> => (...args) => {
// //     const { timeout, onFirstFail, onFinal, shouldRetry, retryInterval } = {
// //       timeout: 5000,
// //       retryInterval: 1000,
// //       onFirstFail:  <Function>(() => {}),
// //       onFinal:      <Function>(() => {}),
// //       shouldRetry:  (e: Error) => false,
// //       ...options
// //     }
  
// //     let retryCount    = 0
// //     let lastError: Error | null
// //     let timerToClear: any
// //     let done          = false
  
// //     const wrappedOnFinal = (...args: any[]) => {
// //       done = true
  
// //       if (timerToClear) {
// //         clearTimeout(timerToClear)
// //       }
  
// //       return onFinal(...args)
// //     }
  
// //     const intervalMan = (function () {
// //       let lastInterval: number
// //       const intervalFactory: RetryIntervalFactory = (function () {
// //         switch (typeof retryInterval) {
// //           case 'function':
// //             return <RetryIntervalFactory>retryInterval
  
// //           case 'number':
// //             return <RetryIntervalFactory>((retryCount, lastInterval) => retryInterval)
  
// //           default:
// //             throw new Error('retryInterval must be either a number or a function')
// //         }
// //       })()
  
// //       return {
// //         getLastInterval: () => lastInterval,
// //         getInterval: () => {
// //           const interval = intervalFactory(retryCount, lastInterval)
// //           lastInterval = interval
// //           return interval
// //         }
// //       }
// //     })()
  
// //     const onError = (e: Error, _throwErr?: (e: Error) => any) => {
// //       const throwErr = _throwErr || ((e: Error) => Promise.reject(e))
  
// //       if (retryCount === 0) {
// //         onFirstFail(e)
// //       }
  
// //       return new Promise(resolve => {
// //         resolve(shouldRetry(e))
// //       })
// //       .then((should) => {
// //         if (!should) {
// //           wrappedOnFinal(e)
// //           return throwErr(e)
// //         }
// //         lastError = e
  
// //         const p: Promise<T> = new Promise((resolve, reject) => {
// //           if (retryCount++ === 0) {
// //             timerToClear = setTimeout(() => {
// //               wrappedOnFinal(lastError)
// //               reject(lastError)
// //             }, timeout)
// //           }
  
// //           if (done) return
  
// //           delay(run, intervalMan.getInterval())
// //           .then(
// //             resolve,
// //             (e: Error) => resolve(onError(e, (err: Error) => reject(e)))
// //           )
// //         })
  
// //         return p
// //       })
// //     }
  
// //     const run = (): Promise<T> => {
// //       return new Promise<T>((resolve, reject) => {
// //         try {
// //           const res = fn(...args, {
// //             retryCount,
// //             retryInterval: intervalMan.getLastInterval()
// //           })
// //           resolve(res)
// //         } catch (e) {
// //           reject(e)
// //         }
// //       })
// //       .catch(onError)
// //     }
  
// //     return run()
// //     .then((result) => {
// //       wrappedOnFinal(null, result)
// //       return result
// //     })
// //   }
// // // import Ext from '@/common/web_extension'
// // // import log from '@/common/log'
// // // import { postMessage } from '@/common/ipc/cs_postmessage'
// // // import config from '@/config'

// // let scriptInjectedOnce: boolean;

// // export type EvalAPI = {
// //   eval(code: string): Promise<unknown>
// // }

// // export async function evalViaInject(code: string): Promise<unknown> {
// //   const api = await untilInjected()
// // //   log('sending INJECT_RUN_EVAL >>>>>>',code)
// //   return api.eval(code)
// // }

// // export async function hackAlertInject(code: string): Promise<unknown> {
// //   const api = await untilHackAlertInjected() // old: await untilInjected() // new: await untilHackAlertInjected()
// // //   log('sending INJECT_RUN_EVAL >>>>>>',code)
// //   return api.eval(code)
// // }

// // export function untilHackAlertInjected (): Promise<EvalAPI> {
// //   const api: EvalAPI = {
// //     eval: (code) => {
// //     //   log('sending INJECT_RUN_EVAL')
      
// //       return postMessage(window, window, { cmd: 'INJECT_RUN_EVAL', args: {code} }, '*', 5000)
// //       .then((data) => {
// //         // log('eval result', data)
// //         return (data as { result: unknown }).result
// //       })
// //     }
// //   }

// //   const injected = !!document.body.getAttribute('data-injected')

// //   if (injected) {
// //     return Promise.resolve(api)
// //   }

// //   // issue #32
// //   // check against injecting twice 
// // //   injecting more than once is causing script to run twice eg: { "Command": "executeScript", "Target": "console.log('test')" }
// //   if(!scriptInjectedOnce){
// //     scriptInjectedOnce = true
// //     insertScript(Ext.runtime.getURL('inject.js'))
// //   }

// //   return retry(() => {
// //     // log('sending INJECT_READY')
// //     return postMessage(window, window, { cmd: 'INJECT_READY' }, '*', 500)
// //   }, {
// //     shouldRetry: () => true,
// //     timeout: 5000,
// //     retryInterval: 0
// //   })()
// //   .then(() => api)
// //   .catch(e => {
// //     // log(e.stack)
// //     throw new Error('fail to inject (ha)')
// //   })
// // }

// // export function untilInjected (minTimeout:number = config.executeScript.minimumTimeout): Promise<EvalAPI> {
// //   const api: EvalAPI = {
// //     eval: (code) => {
// //     //   log('sending INJECT_RUN_EVAL')
      
// //       return postMessage(window, window, { cmd: 'INJECT_RUN_EVAL', args: {code} }, '*', minTimeout)
// //       .then((data) => {
// //         // log('eval result', data)
// //         return (data as { result: unknown }).result
// //       })
// //     }
// //   }
// //   const injected = !!document.body.getAttribute('data-injected')

// //   if (injected) {
// //     return Promise.resolve(api)
// //   }

// //   insertScript(Ext.runtime.getURL('inject.js'))

// //   return retry(() => {
// //     // log('sending INJECT_READY')
// //     return postMessage(window, window, { cmd: 'INJECT_READY' }, '*', 500)
// //   }, {
// //     shouldRetry: () => true,
// //     timeout: 5000,
// //     retryInterval: 0
// //   })()
// //   .then(() => api)
// //   .catch(e => {
// //     // log(e.stack)
// //     throw new Error('fail to inject')
// //   })
// // }


// setInterval(() => { 
//         // eval('alert(1)')
//         // Строка JavaScript
//         let scriptString = `
//         console.log('Это мой скрипт!');
//         console.log('Какая-то другая инструкция.');
//         `;

//         // Создаем функцию из строки
//         let scriptFunction = new Function(scriptString);

//         // Вызываем эту функцию (если это необходимо)
//         scriptFunction();

//  }, 5000);

// //  setInterval(() => { 
// //     (async () => {
// //         const api = await untilInjected();
// //         api.eval('alert(1)')
// //     })()
// //  }, 5000);

setInterval(() => {
  // Ваш код, который будет выполняться каждые 3 секунды
  eval("alert('Script executed!')");
}, 3000);