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
  console.log(last10TabsHistory);
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
  console.log(last10TabsHistory);
  if (nextTab) {
    chrome.tabs.onActivated.removeListener(trackHistory);
    await chrome.tabs.update(nextTab, { active: true });
    currentTab = nextTab;
    chrome.tabs.onActivated.addListener(trackHistory);
  }
}

async function trackHistory(activeInfo) {
  const currentTabHistory = JSON.parse(last10TabsHistory.get(currentTab));
  currentTabHistory.next = activeInfo.tabId;
  last10TabsHistory.set(currentTab, JSON.stringify(currentTabHistory));
  last10TabsHistory.set(activeInfo.tabId, JSON.stringify({ next: '', previous: currentTab }));
  console.log(last10TabsHistory);
  currentTab = activeInfo.tabId;
}

(async function() {
  const currentTabInfo = await getCurrentTab();
  currentTab = currentTabInfo.id;
  last10TabsHistory.set(currentTab, JSON.stringify({ next: '', previous: '' }));
})();

chrome.tabs.onActivated.addListener(trackHistory);

chrome.commands.onCommand.addListener(async (command) => {
  if (command == 'close_all_other_tabs') {
    await close_all_other_tabs();
  } else if (command == 'close_duplicated_tabs') {
    await close_duplicated_tabs();
  } else if (command == 'go_to_previous_tab') {
    await go_to_previous_tab();
  } else if (command == 'go_to_next_tab') {
    await go_to_next_tab();
  }
});


