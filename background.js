// chrome.tabs.getSelected(windowId, function(tab) {
//   alert("current:" + tab.url);
// });

chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    y = tab.url;
    chrome.tabs.executeScript({
      code: "console.log('hi')"
    });
  });
});
