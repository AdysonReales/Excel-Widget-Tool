// Opera GX does not permit arbitrary extensions to override its new-tab page.
// Redirect only newly created tabs that actually arrive on a known start page.
// The toolbar action remains available if Opera does not expose the start URL.
const pendingTabs = new Set();
const startPages = new Set([
  'opera://startpage', 'opera://startpage/',
  'browser://startpage', 'browser://startpage/',
  'chrome://newtab', 'chrome://newtab/',
  'chrome://new-tab-page', 'chrome://new-tab-page/',
  'about:newtab'
]);
function openWorkspace(tabId) {
  pendingTabs.delete(tabId);
  chrome.tabs.update(tabId, { url: chrome.runtime.getURL('index.html') }, () => { void chrome.runtime.lastError; });
}
chrome.tabs.onCreated.addListener(tab => {
  if (typeof tab.id !== 'number') return;
  pendingTabs.add(tab.id);
  const url = tab.pendingUrl || tab.url;
  if (startPages.has(url)) openWorkspace(tab.id);
  else if (url && url !== 'about:blank') pendingTabs.delete(tab.id);
});
chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (!pendingTabs.has(tabId) || !change.url) return;
  if (startPages.has(change.url)) openWorkspace(tabId);
  else if (change.url !== 'about:blank') pendingTabs.delete(tabId);
});
chrome.tabs.onRemoved.addListener(tabId => pendingTabs.delete(tabId));
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') }, () => { void chrome.runtime.lastError; });
});
