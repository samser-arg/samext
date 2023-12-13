const allTabsHistory = new Map();
let lastTabNotDeleted = null;
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
  const { id } = await getCurrentTab();
  if (allTabsHistory.has(id)) {
    const currentTabHistory = JSON.parse(allTabsHistory.get(id));
    const previousTab = currentTabHistory.previous;
    if (previousTab) {
      chrome.tabs.onActivated.removeListener(trackHistory);
      await chrome.tabs.update(previousTab, { active: true });
      currentTab = previousTab;
      chrome.tabs.onActivated.addListener(trackHistory);
    }
  }
}

async function go_to_next_tab() {
  const { id } = await getCurrentTab();
  if (allTabsHistory.has(id)) {
    const currentTabHistory = JSON.parse(allTabsHistory.get(id));
    const nextTab = currentTabHistory.next;
    if (nextTab) {
      chrome.tabs.onActivated.removeListener(trackHistory);
      await chrome.tabs.update(nextTab, { active: true });
      currentTab = nextTab;
      chrome.tabs.onActivated.addListener(trackHistory);
    }
  }
}

async function trackHistory(activeInfo) {
  if (allTabsHistory.has(currentTab)) {
    const currentTabHistory = JSON.parse(allTabsHistory.get(currentTab));
    if (!currentTabHistory.next) {
      currentTabHistory.next = activeInfo.tabId;
    } else {
      let currentNext = currentTabHistory.next;
      while (currentNext) {
        const pivot = currentNext.next;
        allTabsHistory.delete(currentNext);
        currentNext = pivot;
      }
    }
    allTabsHistory.set(currentTab, JSON.stringify(currentTabHistory));
    allTabsHistory.set(activeInfo.tabId, JSON.stringify({ next: '', previous: currentTab }));
  } else if (lastTabNotDeleted) {
    // last tab was removed
    const lastTabNotDeletedHistory = JSON.parse(allTabsHistory.get(lastTabNotDeleted));
    lastTabNotDeletedHistory.next = activeInfo.tabId;
    allTabsHistory.set(lastTabNotDeleted, JSON.stringify(lastTabNotDeletedHistory))

    allTabsHistory.set(activeInfo.tabId, JSON.stringify({ previous: lastTabNotDeleted, next: '' }))

    lastTabNotDeleted = null;
  }
  currentTab = activeInfo.tabId;
}

(async function() {
  const { id } = await getCurrentTab();
  currentTab = id;
  allTabsHistory.set(id, JSON.stringify({ next: '', previous: '' }));
})();

chrome.tabs.onActivated.addListener(trackHistory);

chrome.tabs.onRemoved.addListener((tabId) => {
  if (allTabsHistory.has(tabId)) {
    const tabIdHistory = JSON.parse(allTabsHistory.get(tabId));
    const previousTab = tabIdHistory.previous;
    const nextTab = tabIdHistory.next;
    if (previousTab) {
      const previousTabHistory = JSON.parse(allTabsHistory.get(previousTab));
      previousTabHistory.next = nextTab;
      allTabsHistory.set(previousTab, JSON.stringify(previousTabHistory));
    }
    if (nextTab) {
      const nextTabHistory = JSON.parse(allTabsHistory.get(nextTab));
      nextTabHistory.previous = previousTab;
      allTabsHistory.set(nextTab, JSON.stringify(nextTabHistory));
    } else {
      lastTabNotDeleted = previousTab;
    }
    allTabsHistory.delete(tabId);
  }
});

chrome.runtime.onInstalled.addListener((reason) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    checkCommandShortcuts();
  }
});

function checkCommandShortcuts() {
  chrome.commands.getAll((commands) => {
    let missingShortcuts = [];

    for (let { name, shortcut } of commands) {
      if (shortcut === '') {
        missingShortcuts.push(name);
      }
    }

    if (missingShortcuts.length > 0) {
      console.log(missingShortcuts);
    }
  });
}

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


