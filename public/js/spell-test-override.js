const origPrompt = window.prompt;
const origAlert = window.alert;
const origLog = console.log;

const runid = document.head.getAttribute('data-runid');

var isIframe = parent.document != document;

function logToParent(message) {
    if (isIframe) {
        parent.postMessage([Date.now(), 'testlog', message], '*');
    }
}

// logToParent([Date.now(),'runid', runid]);

window.prompt = function() {
    var result = origPrompt.apply(this, arguments);
    // logToParent([Date.now(), 'prompt', result, Array.from(arguments)]);
    return result;
}

window.alert = function() {
    // logToParent([Date.now(), 'alert', Array.from(arguments)]);
    // origAlert.apply(this, arguments);
}

// console.log = function(a) {
//     // logToParent([Date.now(), 'log', Array.from(arguments)]);
//     origLog.apply(this, arguments);
// }

var observer = new MutationObserver((x) => origLog(x));
// observer.observe(document, {childList: true,
//     attributes: true,
//     characterData: true,
//     subtree: true,
//     attributeOldValue: true,
//     characterDataOldValue: true
// });
