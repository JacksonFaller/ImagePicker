(function () {
    const groupElem = document.querySelector("#group");
    groupElem.addEventListener("click", async () => await pickClick(false));
    groupElem.innerHTML = browser.i18n.getMessage("pick-group");

    const singleElem = document.querySelector("#single");
    singleElem.addEventListener("click", async () => await pickClick(true));
    singleElem.innerHTML = browser.i18n.getMessage("pick-single");

    const titleElem = document.querySelector("#title");
    titleElem.innerHTML = browser.i18n.getMessage("image-picker");
})();

async function pickClick(single) {
    await browser.runtime.sendMessage({
        from: "popup",
        action: "start-picker",
        single,
    });
    window.close();
}
