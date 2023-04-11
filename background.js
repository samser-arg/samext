let last10Tabs = new Array();
const lastUnique10Tabs = new Set();
let activeTabPosition = 0;

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
  console.log(activeTabPosition, last10Tabs);
  if (activeTabPosition > 0) {
    const previousTab = last10Tabs[activeTabPosition - 1];
    await chrome.tabs.update(previousTab, { active: true });
    activeTabPosition--;
  }
}

async function go_to_next_tab() {
  console.log(activeTabPosition, last10Tabs);
  if (activeTabPosition < last10Tabs.length - 1) {
    const previousTab = last10Tabs[activeTabPosition + 1];
    await chrome.tabs.update(previousTab, { active: true });
    activeTabPosition++;
  }
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!lastUnique10Tabs.has(activeInfo.tabId)) {
    if (last10Tabs.length > 0) {
      activeTabPosition++;
    }
    last10Tabs.push(activeInfo.tabId);
    lastUnique10Tabs.add(activeInfo.tabId);
    if (last10Tabs.length > 20) {
      last10Tabs = last10Tabs.slice(10);
    }
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  lastUnique10Tabs.delete(tabId);
  last10Tabs = last10Tabs.filter(tab => tab !== tabId);
});

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


