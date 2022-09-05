chrome.action.onClicked.addListener(async (tab) => {
  chrome.windows.create({
    url: chrome.runtime.getURL(`/index.html?tabId=${tab.id}`),
    type: "popup",
    width: 600,
    height: 800,
  });
});