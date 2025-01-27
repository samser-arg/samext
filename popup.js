window.onload = async function() {
  const allCommands = await chrome.commands.getAll();
  const close_all_tabs_except_current_command = allCommands.find(command => command.name === "close_all_other_tabs");
  const close_duplicated_tabs_command = allCommands.find(command => command.name === "close_duplicated_tabs");
  const go_to_next_tab_command = allCommands.find(command => command.name === "go_to_next_tab");
  const go_to_previous_tab_command = allCommands.find(command => command.name === "go_to_previous_tab");
  const toggle_muted_state_tab_command = allCommands.find(command => command.name === "toggle_muted_state_tab");
  const close_all_tabs_except_fixed_command = allCommands.find(command => command.name === "close_all_except_fixed_tabs");

  document.getElementById('close-all-except-current-command').textContent = close_all_tabs_except_current_command.shortcut;
  document.getElementById('close-duplicated-command').textContent = close_duplicated_tabs_command.shortcut;
  document.getElementById('go-to-next-tab-command').textContent = go_to_next_tab_command.shortcut;
  document.getElementById('go-to-previous-tab-command').textContent = go_to_previous_tab_command.shortcut;
  document.getElementById('toggle-muted-state-tab-command').textContent = toggle_muted_state_tab_command.shortcut;
  document.getElementById('close-all-except-fixed-command').textContent = close_all_tabs_except_fixed_command.shortcut;

  document.getElementById('close-all-except-current-description').textContent = close_all_tabs_except_current_command.description;
  document.getElementById('close-duplicated-description').textContent = close_duplicated_tabs_command.description;
  document.getElementById('go-to-next-tab-description').textContent = go_to_next_tab_command.description;
  document.getElementById('go-to-previous-tab-description').textContent = go_to_previous_tab_command.description;
  document.getElementById('toggle-muted-state-tab-description').textContent = toggle_muted_state_tab_command.description;
  document.getElementById('close-all-except-fixed-description').textContent = close_all_tabs_except_fixed_command.description;
}
