(() => {
  'use strict';
  const tablist = document.querySelector('.mf-flow-tabs');
  if (!tablist) return;
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  if (panels.some(panel => !panel)) return;

  function select(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
  }
  panels.forEach((panel, i) => {
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabs[i].id);
    panel.tabIndex = 0;
  });
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(next, true);
    });
  });
  function selectFromHash() {
    const index = panels.findIndex(panel => '#' + panel.id === location.hash);
    if (index !== -1) select(index);
  }
  select(0);
  selectFromHash();
  const stackedTabs = window.matchMedia('(max-width: 760px)');
  function updateOrientation() {
    tablist.setAttribute('aria-orientation', stackedTabs.matches ? 'vertical' : 'horizontal');
  }
  updateOrientation();
  stackedTabs.addEventListener('change', updateOrientation);
  tablist.hidden = false;
  window.addEventListener('hashchange', selectFromHash);
})();
