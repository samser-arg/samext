window.onload = async function() {
  const allCommands = await chrome.commands.getAll();
  const close_all_tabs_except_current_command = allCommands.find(command => command.name === "close_all_other_tabs");
  const close_duplicated_tabs_command = allCommands.find(command => command.name === "close_duplicated_tabs");

  const close_all_tabs_except_current = close_all_tabs_except_current_command.shortcut;
  const close_duplicated_tabs = close_duplicated_tabs_command.shortcut;

  document.getElementById('close-all-except-current-command').textContent = close_all_tabs_except_current;
  document.getElementById('close-duplicated-command').textContent = close_duplicated_tabs;
}
