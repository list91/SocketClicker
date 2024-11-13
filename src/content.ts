const tabId = 1; // Например, вы можете динамически определять этот ID

chrome.runtime.sendMessage({ command: "getTabInfo", tabId: tabId }, (response) => {
    if (response.error) {
        console.error("Error fetching tab info:", response.error);
    } else {
        console.log("Tab Info:", response);
    }
});
