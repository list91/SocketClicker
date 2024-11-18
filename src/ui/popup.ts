import {setBadgeText} from "../core/common"

console.log("Hello, world from popup!")

document.addEventListener('DOMContentLoaded', () => {
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
    document.body.appendChild(countLinksButton);

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
    document.body.appendChild(clickButton);
});
