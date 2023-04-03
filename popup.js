window.onload = async function() {
  const allCommands = await chrome.commands.getAll();
  const close_all_tabs_except_current_command = allCommands.find(command => command.name === "close_all_other_tabs")
  const close_all_tabs_except_current = close_all_tabs_except_current_command.shortcut;

  document.getElementById('close-all-except-current-command').textContent = close_all_tabs_except_current;
}
