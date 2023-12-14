let allTabsHistory;

class TabsHistory {
  constructor(value) {
    this.ids = [value];
    this.currentPosition = 0;
  }

  // Insert at a given index
  insert(value) {
    this.ids =
      [
        ...this.ids.slice(0, this.currentPosition + 1),
        value,
        ...this.ids.slice(this.currentPosition + 1)
      ];
    this.currentPosition++;
  }

  // Remove by value
  removeByValue(value) {
    let removedIndexesToTheLeft = []
    this.ids = this.ids.filter((val, idx) => {
      const keepCondition = val !== value;
      if (!keepCondition && idx <= this.currentPosition) {
        removedIndexesToTheLeft.push(idx);
      }
      return keepCondition;
    });
    this.currentPosition -= removedIndexesToTheLeft.length;
  }

  goToPreviousTab() {
    if (this.currentPosition > 0) {
      this.currentPosition--;
      return this.ids[this.currentPosition];
    }
  }

  goToNextTab() {
    if (this.currentPosition < this.ids.length - 1) {
      this.currentPosition++;
      return this.ids[this.currentPosition];
    }
  }
}

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
  chrome.tabs.onActivated.removeListener(trackHistory);
  const previousTab = allTabsHistory.goToPreviousTab();
  await chrome.tabs.update(previousTab, { active: true });
  chrome.tabs.onActivated.addListener(trackHistory);
}

async function go_to_next_tab() {
  chrome.tabs.onActivated.removeListener(trackHistory);
  const nextTab = allTabsHistory.goToNextTab();
  await chrome.tabs.update(nextTab, { active: true });
  chrome.tabs.onActivated.addListener(trackHistory);
}

function trackHistory(activeInfo) {
  allTabsHistory.insert(activeInfo.tabId);
}

(async function() {
  const { id } = await getCurrentTab();
  allTabsHistory = new TabsHistory(id)
})();

chrome.tabs.onActivated.addListener(trackHistory);

chrome.tabs.onRemoved.addListener((tabId) => {
  allTabsHistory.removeByValue(tabId)
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


