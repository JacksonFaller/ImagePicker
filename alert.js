browser.runtime.onMessage.addListener(messageRecieved);

function messageRecieved(message) {
    if (message.action === "alert") {
        alert(message.text);
    }
}
