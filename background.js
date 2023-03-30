async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function getAllTabs() {
  return chrome.tabs.query({ lastFocusedWindow: true });
}

async function removeAllExceptCurrentTab(tabsIds, currentTabId) {
  const allTabIdsExceptCurrent = tabsIds.filter(tabId => tabId != currentTabId);
  await chrome.tabs.remove(allTabIdsExceptCurrent);
}

chrome.commands.onCommand.addListener(async () => {
  const tab = await getCurrentTab();
  const allTabs = await getAllTabs();
  const allTabsIds = allTabs.map(tab => tab.id);
  await removeAllExceptCurrentTab(allTabsIds, tab.id);
});


