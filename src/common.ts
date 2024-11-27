import { browser } from 'webextension-polyfill-ts';

export async function setBadgeText(text: string) {
    if (browser.action) {
        await browser.action.setBadgeText({ text });
    } else if (browser.browserAction) {
        await browser.browserAction.setBadgeText({ text });
    }
}
