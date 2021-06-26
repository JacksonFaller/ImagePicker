browser.runtime.onMessage.addListener(messageRecieved);
browser.menus.onClicked.addListener(menusClick);

browser.menus.create({
    id: "pick-single",
    title: browser.i18n.getMessage("pick-single"),
    contexts: ["image", "page", "frame"],
});

browser.menus.create({
    id: "pick-group",
    title: browser.i18n.getMessage("pick-group"),
    contexts: ["image", "page", "frame"],
});

let options;

(async function () {
    options = await loadOptions();
})();

function messageRecieved(message) {
    switch (message.action) {
        case "start-picker": {
            startPicker(message.single);
            break;
        }
        case "download-picked": {
            downloadPicked(message);
            break;
        }
    }
}

async function menusClick(info, tab) {
    if (info.menuItemId === "pick-single" && info.mediaType === "image") {
        if (info.srcUrl) {
            downloadPicked({ elements: [info.srcUrl] });
        } else {
            showAlert("Couldn't acquire url of the image");
        }
    } else {
        await loadPicker(tab.id);
        browser.tabs.sendMessage(tab.id, {
            action: info.menuItemId,
            elementId: info.targetElementId,
        });
    }
}

async function loadPicker(tabId) {
    const elementPickerDefined = await browser.tabs.executeScript(tabId, {
        code: 'typeof elementPicker === "undefined";',
    });
    if (elementPickerDefined[0] === true) {
        await browser.tabs.executeScript(tabId, { file: "/element-picker/index.js" });
        await browser.tabs.executeScript(tabId, { file: "/picker.js" });
    }
}

async function startPicker(single) {
    const tabId = (await browser.tabs.query({ currentWindow: true, active: true }))[0].id;
    await loadPicker(tabId);
    browser.tabs.sendMessage(tabId, { action: "activate", single });
}

async function downloadPicked(message) {
    if (!message.downloadFolder) {
        message.downloadFolder = "";
    } else if (message.downloadFolder[message.downloadFolder.length - 1] !== "/") {
        message.downloadFolder += "/";
    }

    const getFilePath = options.useIncremetNames
        ? (_, i) => `${message.downloadFolder}${i}`
        : (image) => `${message.downloadFolder}${formatDownloadUrl(image)}`;

    await Promise.all(
        message.elements.map((image, i) => {
            const filePath = getFilePath(image, i);
            return browser.downloads.download({
                url: image,
                saveAs: false,
                filename: filePath,
            });
        })
    );
    showAlert("Download complete!");
}

function showAlert(message) {
    const tabId = (await browser.tabs.query({ currentWindow: true, active: true }))[0].id;
    await browser.tabs.executeScript(tabId, { file: "/alert.js" });
    browser.tabs.sendMessage(tabId, {
        action: "alert",
        text: message,
    });
}

function formatDownloadUrl(url) {
    return url.split("/").pop().split("#")[0].split("?")[0];
}

async function loadOptions() {
    let options = (await browser.storage.sync.get("options")).options;
    if (!options) {
        options = defaultOptions;
        browser.storage.sync.set({ options });
    }
    return options;
}
