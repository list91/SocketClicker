// Function to count links on the page
function countLinks() {
    const links = document.getElementsByTagName('a');
    const count = links.length;
    
    // Show alert with link count
    if (count === 0) {
        alert('No links found on this page');
    } else {
        alert(`Found ${count} link${count === 1 ? '' : 's'} on this page`);
    }
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'countLinks') {
        countLinks();
    }
});

// Run the link counter when the page is loaded
document.addEventListener('DOMContentLoaded', countLinks);
