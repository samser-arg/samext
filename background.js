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

async function close_duplicated_tabs() {
  const allTabs = await getAllTabs();
  const uniqUrls = new Set(allTabs.map(tab => tab.url));
  const tabIdsToRemove = [];
  allTabs.map(tab => {
    if (!uniqUrls.has(tab.url)) {
      tabIdsToRemove.push(tab.id);
    } else {
      uniqUrls.delete(tab.url);
    }
  })
  await chrome.tabs.remove(tabIdsToRemove);
}

async function close_all_other_tabs() {
  const tab = await getCurrentTab();
  const allTabs = await getAllTabs();
  const allTabsIds = allTabs.map(tab => tab.id);
  await removeAllExceptCurrentTab(allTabsIds, tab.id);
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command == 'close_all_other_tabs') {
    await close_all_other_tabs();
  } else if (command == 'close_duplicated_tabs') {
    await close_duplicated_tabs();
  }
});


