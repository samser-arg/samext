const last10TabsHistory = new Map();
let currentTab;

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

async function go_to_previous_tab() {
  const currentTabHistory = JSON.parse(last10TabsHistory.get(currentTab));
  const previousTab = currentTabHistory.previous;
  if (previousTab) {
    chrome.tabs.onActivated.removeListener(trackHistory);
    await chrome.tabs.update(previousTab, { active: true });
    currentTab = previousTab;
    chrome.tabs.onActivated.addListener(trackHistory);
  }
}

async function go_to_next_tab() {
  const currentTabHistory = JSON.parse(last10TabsHistory.get(currentTab));
  const nextTab = currentTabHistory.next;
  if (nextTab) {
    chrome.tabs.onActivated.removeListener(trackHistory);
    await chrome.tabs.update(nextTab, { active: true });
    currentTab = nextTab;
    chrome.tabs.onActivated.addListener(trackHistory);
  }
}

async function trackHistory(activeInfo) {
  if (last10TabsHistory.has(currentTab)) {
    const currentTabHistory = JSON.parse(last10TabsHistory.get(currentTab));
    currentTabHistory.next = activeInfo.tabId;
    last10TabsHistory.set(currentTab, JSON.stringify(currentTabHistory));
    last10TabsHistory.set(activeInfo.tabId, JSON.stringify({ next: '', previous: currentTab }));
  }
  currentTab = activeInfo.tabId;
}

(async function() {
  const currentTabInfo = await getCurrentTab();
  currentTab = currentTabInfo.id;
  last10TabsHistory.set(currentTab, JSON.stringify({ next: '', previous: '' }));
})();

chrome.tabs.onActivated.addListener(trackHistory);

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (last10TabsHistory.has(tabId)) {
    const tabIdHistory = JSON.parse(last10TabsHistory.get(tabId));
    const previousTab = tabIdHistory.previous;
    const nextTab = tabIdHistory.next;
    if (previousTab) {
      const previousTabHistory = JSON.parse(last10TabsHistory.get(previousTab));
      previousTabHistory.next = nextTab;
      last10TabsHistory.set(previousTab, JSON.stringify(previousTabHistory));
    }
    if (nextTab) {
      const nextTabHistory = JSON.parse(last10TabsHistory.get(nextTab));
      nextTabHistory.previous = previousTab;
      last10TabsHistory.set(nextTab, JSON.stringify(nextTabHistory));
    }
    last10TabsHistory.delete(tabId);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case 'close_all_other_tabs':
      await close_all_other_tabs();
      break;
    case 'close_duplicated_tabs':
      await close_duplicated_tabs();
      break;
    case 'go_to_previous_tab':
      await go_to_previous_tab();
      break;
    case 'go_to_next_tab':
      await go_to_next_tab();
      break;
  }
});


