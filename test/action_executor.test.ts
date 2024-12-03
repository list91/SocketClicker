import ActionExecutor from '../src/actions/action_executor';
import { ActionType } from '../src/actions/action_collection';

// Мок для XPath
const mockXPathResult = {
  singleNodeValue: {
    click: jest.fn(),
    textContent: 'Test Text',
    dispatchEvent: jest.fn(),
    value: ''
  },
  iterateNext: jest.fn()
};

// Мок для глобальных объектов
const mockDocument = {
  evaluate: jest.fn().mockReturnValue(mockXPathResult)
};

const mockWindow = {
  location: { href: '' },
  scrollTo: jest.fn(),
  XPathResult: {
    FIRST_ORDERED_NODE_TYPE: 9
  }
};

// Мок для chrome API
const mockChrome = {
  runtime: {
    sendMessage: jest.fn().mockResolvedValue({ success: true }),
    lastError: null
  }
};

// Временно заменяем глобальные объекты
(global as any).document = mockDocument;
(global as any).window = mockWindow;
(global as any).chrome = mockChrome;
(global as any).XPathResult = mockWindow.XPathResult;

describe('ActionExecutor', () => {
  let executor: any;

  beforeEach(() => {
    executor = new ActionExecutor();
    // Очистка моков перед каждым тестом
    jest.clearAllMocks();
    mockDocument.evaluate.mockReturnValue(mockXPathResult);
  });

  // Существующие позитивные тесты
  it('GO action', async () => {
    // Mock chrome runtime
    const originalChrome = (global as any).chrome;
    (global as any).chrome = {
      runtime: {
        sendMessage: jest.fn((message, callback) => {
          callback({ success: true });
        })
      }
    };

    const result = await executor.execute({
      action: ActionType.GO,
      value: 'https://example.com'
    });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Restore original chrome
    (global as any).chrome = originalChrome;
  }, 5000);

  it('CLICK action', async () => {
    const result = await executor.execute({
      action: ActionType.CLICK,
      element_xpath: '//*[@id="test-button"]'
    });
    expect(result).toBeDefined();
  });

  it('INPUT action', async () => {
    const result = await executor.execute({
      action: ActionType.INPUT,
      element_xpath: '//*[@id="test-input"]',
      value: 'Test Input'
    });
    expect(result).toBeDefined();
  });

  it('WAIT action', async () => {
    jest.useFakeTimers();
    
    const timeoutPromise = executor.execute({
      action: ActionType.WAIT,
      value: 100
    });

    jest.advanceTimersByTime(200);

    await expect(timeoutPromise).rejects.toThrow('Action timed out');

    jest.useRealTimers();
  });

  it('GET_TEXT action', async () => {
    const result = await executor.execute({
      action: ActionType.GET_TEXT,
      element_xpath: '//*[@id="test-text"]'
    });
    expect(result).toBeDefined();
  });

  // Тесты обработки ошибок
  describe('Error Handling', () => {
    it('should handle invalid action type', async () => {
      await expect(executor.execute({
        action: 'INVALID_ACTION' as any,
      })).rejects.toThrow('Unsupported action type');
    });

    it('should handle missing required parameters', async () => {
      // Тест для GO action без URL
      await expect(executor.execute({
        action: ActionType.GO,
      })).rejects.toThrow('URL is required');

      // Тест для CLICK action без xpath
      await expect(executor.execute({
        action: ActionType.CLICK,
      })).rejects.toThrow('Element xpath is required');

      // Тест для INPUT action без значения
      await expect(executor.execute({
        action: ActionType.INPUT,
        element_xpath: '//input'
      })).rejects.toThrow('Invalid input value');
    });

    it('should handle element not found', async () => {
      // Мокаем метод evaluate для возврата null
      mockDocument.evaluate.mockReturnValueOnce({ 
        singleNodeValue: null,
        iterateNext: jest.fn()
      });

      await expect(executor.execute({
        action: ActionType.CLICK,
        element_xpath: '//non-existent-element'
      })).rejects.toThrow('Element not found');
    });

    it('should handle timeout errors', async () => {
      // Мокаем таймаут
      jest.useFakeTimers();
      
      const timeoutPromise = executor.execute({
        action: ActionType.WAIT,
        value: 100
      });

      // Симулируем превышение таймаута
      jest.advanceTimersByTime(200);

      await expect(timeoutPromise).rejects.toThrow('Action timed out');

      jest.useRealTimers();
    });

    it('should handle chrome runtime message errors', async () => {
      // Simulate no chrome runtime
      const originalChrome = (global as any).chrome;
      (global as any).chrome = null;

      // Mock window.location.href
      const originalLocation = window.location;
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        writable: true,
        value: mockLocation
      });

      const result = await executor.execute({
        action: ActionType.GO,
        value: 'https://example.com'
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockLocation.href).toBe('https://example.com');

      // Restore original chrome and location
      (global as any).chrome = originalChrome;
      Object.defineProperty(window, 'location', {
        writable: false,
        value: originalLocation
      });
    }, 15000);

    it('should handle invalid input values', async () => {
      // Тест для некорректных значений
      await expect(executor.execute({
        action: ActionType.INPUT,
        element_xpath: '//input',
        value: null
      })).rejects.toThrow('Invalid input value');

      await expect(executor.execute({
        action: ActionType.INPUT,
        element_xpath: '//input',
        value: ''
      })).rejects.toThrow('Invalid input value');
    });
  });
});
