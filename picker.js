browser.runtime.onMessage.addListener(messageRecieved);

(async function () {
    pickerOptions = await loadOptions();
})();

function messageRecieved(message) {
    switch (message.action) {
        case "activate": {
            activate(message.single);
            break;
        }
        case "pick-single": {
            pickSingle(browser.menus.getTargetElement(message.elementId));
            break;
        }
        case "pick-group": {
            pickGroup(browser.menus.getTargetElement(message.elementId));
            break;
        }
    }
}

function pickerClick(element) {
    if (pickerOptions.single) {
        pickSingle(element);
    } else {
        pickGroup(element);
    }
    document.removeEventListener("keydown", keyDown);
}

function pickSingle(element) {
    let nonImage = true;
    let stack = [element];
    let img;

    while (stack.length != 0) {
        element = stack.pop();
        img = getComputedStyle(element).backgroundImage;
        if (img && img.includes("url")) {
            nonImage = false;
            break;
        }
        stack.unshift(...element.children);
    }

    if (nonImage) {
        alert("Selected element is not an image!");
        return;
    }

    const elements = img.split(",").map((x) => getUrlFromBackGroundImage(x));
    browser.runtime.sendMessage({
        from: "picker",
        action: "download-picked",
        elements,
    });
}

function pickGroup(element) {
    let selector = element.nodeName;
    let map = (arr) => arr.map((x) => x.src);
    if (element.style.backgroundImage) {
        selector += "[style*=background-image]";
        map = (arr) => arr.map((x) => getUrlFromBackGroundImage(x.style.backgroundImage));
    } else if (element.nodeName !== "IMG") {
        // can't process this kind of images fall back to a single image picker
        pickSingle(element);
        return;
    }

    let container = element.parentNode;
    let elements = container.querySelectorAll(selector);
    if (elements.length === 0) {
        alert("No images found to download");
        return;
    }

    while (elements.length === 1 && container && !container.id) {
        selector = `${getElementSelector(container)}>${selector}`;
        container = container.parentNode;
        elements = container.querySelectorAll(selector);
    }

    sendForDownload(elements, map);
}

function getUrlFromBackGroundImage(img) {
    return img.trim().slice(4, -1).replace(/["']/g, "");
}

function sendForDownload(elements, map) {
    let downloadFolder;
    if (elements.length === 1) {
        if (confirm("Single image found, download?")) {
            downloadFolder = pickerOptions.defaultDownloadFolder;
        }
    } else {
        downloadFolder = prompt(
            `Found ${elements.length} images.\nPlease, enter download directory path.`,
            pickerOptions.defaultDownloadFolder
        );
    }

    if (downloadFolder) {
        browser.runtime.sendMessage({
            from: "picker",
            action: "download-picked",
            downloadFolder,
            elements: map(Array.from(elements)),
        });
    }
}

function activate(single) {
    elementPicker.init({ onClick: pickerClick });
    pickerOptions.single = single;
    document.addEventListener("keydown", keyDown);
}

function getElementSelector(element) {
    return element.classList.length > 0 ? `.${element.classList[0]}` : element.nodeName;
}

async function loadOptions() {
    return (await browser.storage.sync.get("options")).options;
}

function keyDown(event) {
    if (event.key === "Escape") {
        elementPicker.reset();
        document.removeEventListener("keydown", keyDown);
    }
}
