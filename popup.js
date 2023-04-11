window.onload = async function() {
  const allCommands = await chrome.commands.getAll();
  const close_all_tabs_except_current_command = allCommands.find(command => command.name === "close_all_other_tabs");
  const close_duplicated_tabs_command = allCommands.find(command => command.name === "close_duplicated_tabs");
  const go_to_next_tab_command = allCommands.find(command => command.name === "go_to_next_tab");
  const go_to_previous_tab_command = allCommands.find(command => command.name === "go_to_previous_tab");

  const close_all_tabs_except_current = close_all_tabs_except_current_command.shortcut;
  const close_duplicated_tabs = close_duplicated_tabs_command.shortcut;
  const go_to_next_tab = go_to_next_tab_command.shortcut;
  const go_to_previous_tab = go_to_previous_tab_command.shortcut;

  document.getElementById('close-all-except-current-command').textContent = close_all_tabs_except_current;
  document.getElementById('close-duplicated-command').textContent = close_duplicated_tabs;
  document.getElementById('go-to-next-tab-command').textContent = go_to_next_tab;
  document.getElementById('go-to-previous-tab-command').textContent = go_to_previous_tab;
}
