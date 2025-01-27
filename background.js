import { TabsHistory } from "./tabs-history.js";
import { Mutex } from "./mutex.js"

const storageMutex = new Mutex();

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function toggle_muted_state_tab() {
  const currentTab = await getCurrentTab();
  const muted = !currentTab.mutedInfo.muted;
  await chrome.tabs.update(currentTab.id, { muted })
}

async function close_all_except_fixed_tabs() {
  const allTabs = await chrome.tabs.query({ lastFocusedWindow: true });
  const nonPinnedTabs = allTabs.filter(tab => !tab.pinned).map(tab => tab.id)

  await chrome.tabs.remove(nonPinnedTabs);
}

async function close_duplicated_tabs() {
  const allTabs = await chrome.tabs.query({ lastFocusedWindow: true });
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
  await storageMutex.synchronize(
    async () => {
      const tab = await getCurrentTab();
      const allTabs = await chrome.tabs.query({ lastFocusedWindow: true });
      const allTabsIds = allTabs.map(tab => tab.id);
      const allTabIdsExceptCurrent = allTabsIds.filter(tabId => tabId !== tab.id);
      await chrome.tabs.remove(allTabIdsExceptCurrent);
      const tabsHistory = new TabsHistory([tab.id], 0);
      return saveTabs(tabsHistory)
    }
  )
}

async function go_to_previous_tab() {
  chrome.tabs.onActivated.removeListener(onActivate);
  await storageMutex.synchronize(
    async () => {
      const tabs = await getTabs();
      const previousTab = tabs.goToPreviousTab();
      await chrome.tabs.update(previousTab, { active: true });
      return saveTabs(tabs);
    }
  )
  chrome.tabs.onActivated.addListener(onActivate);
}

async function go_to_next_tab() {
  chrome.tabs.onActivated.removeListener(onActivate);
  await storageMutex.synchronize(
    async () => {
      const tabs = await getTabs();
      const nextTab = tabs.goToNextTab();
      await chrome.tabs.update(nextTab, { active: true });
      return saveTabs(tabs);
    }
  )
  chrome.tabs.onActivated.addListener(onActivate);
}

const getTabs = async () => {
  const { tabs } = await chrome.storage.local.get('tabs');
  const tabsHistory = TabsHistory.deserialize(JSON.parse(tabs).ids, JSON.parse(tabs).currentPosition)
  return tabsHistory;
}

const saveTabs = async (tabsHistory) => {
  await chrome.storage.local.set({ 'tabs': tabsHistory.serialize() });
  return tabsHistory;
}

const onActivate = (activeInfo) =>
  storageMutex.synchronize(
    async () => {
      const tabs = await getTabs();
      tabs.insert(activeInfo.tabId);
      await saveTabs(tabs);
    }
  )

const onRemove = (tabId) => storageMutex.synchronize(
  async () => {
    const tabs = await getTabs();
    tabs.removeByValue(tabId);
    await saveTabs(tabs);
  }
)

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
    case 'toggle_muted_state_tab':
      await toggle_muted_state_tab();
      break;
    case 'close_all_except_fixed_tabs':
      await close_all_except_fixed_tabs();
      break;
  }
});


