import {setBadgeText} from "../core/common"
import { getState, setState } from "../core/common"

console.log("Hello, world from popup!")

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.createElement('div');
    container.style.padding = '10px';
    container.style.minWidth = '200px';

    // Create toggle switch
    const toggleContainer = document.createElement('div');
    toggleContainer.style.marginBottom = '20px';
    toggleContainer.style.display = 'flex';
    toggleContainer.style.alignItems = 'center';
    toggleContainer.style.gap = '10px';

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.id = 'enableToggle';
    toggle.style.transform = 'scale(1.5)';

    const label = document.createElement('label');
    label.htmlFor = 'enableToggle';
    label.textContent = 'Enable Extension';
    label.style.fontSize = '16px';

    toggleContainer.appendChild(toggle);
    toggleContainer.appendChild(label);
    container.appendChild(toggleContainer);

    // Status text
    const status = document.createElement('div');
    status.style.marginTop = '10px';
    status.style.padding = '10px';
    status.style.borderRadius = '5px';
    status.style.textAlign = 'center';
    container.appendChild(status);

    // Initialize state
    const state = await getState();
    toggle.checked = state.enabled;
    updateStatus();

    // Handle toggle
    toggle.addEventListener('change', async () => {
        await setState({ enabled: toggle.checked });
        updateStatus();
    });

    function updateStatus() {
        status.textContent = toggle.checked ? 'Extension is active' : 'Extension is disabled';
        status.style.backgroundColor = toggle.checked ? '#e8f5e9' : '#ffebee';
        status.style.color = toggle.checked ? '#2e7d32' : '#c62828';
    }

    const countLinksButton = document.createElement('button');
    countLinksButton.textContent = 'Count Links';
    countLinksButton.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0].id) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: () => {
                        const links = document.getElementsByTagName('a');
                        const count = links.length;
                        
                        if (count === 0) {
                            alert('No links found on this page');
                        } else {
                            alert(`Found ${count} link${count === 1 ? '' : 's'} on this page`);
                        }
                    }
                });
            }
        });
    });
    container.appendChild(countLinksButton);

    const clickButton = document.createElement('button');
    clickButton.textContent = 'Click Link';
    clickButton.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0].id) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: () => {
                        const xpath = '//*[@id="js-news-list"]/div[1]/div/div[2]/div[2]/a';
                        const element = document.evaluate(
                            xpath,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        ).singleNodeValue as HTMLElement;

                        if (element) {
                            element.click();
                        } else {
                            alert('Link not found on this page');
                        }
                    }
                });
            }
        });
    });
    container.appendChild(clickButton);

    document.body.appendChild(container);
});
