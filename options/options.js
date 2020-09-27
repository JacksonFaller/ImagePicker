document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
document.querySelector("#reset").addEventListener("click", resetOptions);

function saveOptions(e) {
    browser.storage.sync.set({
        options: {
            defaultDownloadFolder: document.querySelector("#defaultDownloadFolder").value,
            useIncremetNames: document.querySelector("#useIncremetNames").checked,
        },
    });
    e.preventDefault();
}

async function restoreOptions() {
    const res = await browser.storage.sync.get("options");
    if (!res.options) {
        options = defaultOptions;
        browser.storage.sync.set({ options: res.options });
    }
    document.querySelector("#defaultDownloadFolder").value = res.options.defaultDownloadFolder;
    document.querySelector("#useIncremetNames").checked = res.options.useIncremetNames;
}

function resetOptions() {
    browser.storage.sync.remove("options");
}
