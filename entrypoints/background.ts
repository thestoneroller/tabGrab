export default defineBackground(() => {
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "update") {
      browser.tabs.create({
        url: browser.runtime.getURL("/changelog.html"),
      });
    }
  });
});
