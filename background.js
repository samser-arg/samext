import { TabsHistory } from "./tabs-history.js";

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function getAllTabs() {
  return chrome.tabs.query({ lastFocusedWindow: true });
}

async function removeAllExceptCurrentTab(tabsIds, currentUserPositionId) {
  const allTabIdsExceptCurrent = tabsIds.filter(tabId => tabId != currentUserPositionId);
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
  chrome.tabs.onActivated.removeListener(onActivate);
  const { tabs } = await chrome.storage.local.get('tabs');
  const tabsHistory = TabsHistory.deserialize(JSON.parse(tabs).ids, JSON.parse(tabs).currentPosition)
  const previousTab = tabsHistory.goToPreviousTab();
  await chrome.tabs.update(previousTab, { active: true });
  await chrome.storage.local.set({ 'tabs': tabsHistory.serialize() });
  chrome.tabs.onActivated.addListener(onActivate);
}

async function go_to_next_tab() {
  chrome.tabs.onActivated.removeListener(onActivate);
  const { tabs } = await chrome.storage.local.get('tabs');
  const tabsHistory = TabsHistory.deserialize(JSON.parse(tabs).ids, JSON.parse(tabs).currentPosition)
  const nextTab = tabsHistory.goToNextTab();
  await chrome.tabs.update(nextTab, { active: true });
  await chrome.storage.local.set({ 'tabs': tabsHistory.serialize() });
  chrome.tabs.onActivated.addListener(onActivate);
}

async function onActivate(activeInfo) {
  const { tabs } = await chrome.storage.local.get('tabs');
  const tabsHistory = TabsHistory.deserialize(JSON.parse(tabs).ids, JSON.parse(tabs).currentPosition)
  tabsHistory.insert(activeInfo.tabId);
  await chrome.storage.local.set({ 'tabs': tabsHistory.serialize() });
}

async function onRemove(tabId) {
  const { tabs } = await chrome.storage.local.get('tabs');
  const tabsHistory = TabsHistory.deserialize(JSON.parse(tabs).ids, JSON.parse(tabs).currentPosition)
  tabsHistory.removeByValue(tabId);
  await chrome.storage.local.set({ 'tabs': tabsHistory.serialize() });
}

chrome.tabs.onActivated.addListener(onActivate);

chrome.tabs.onRemoved.addListener(onRemove);

self.addEventListener('activate', async () => {
  const { id } = await getCurrentTab();
  const allTabsHistory = new TabsHistory([id], 0)
  await chrome.storage.local.set({ 'tabs': allTabsHistory.serialize() });
})

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


