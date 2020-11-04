const origPrompt = window.prompt;
const origAlert = window.alert;
const origLog = console.log;

const runid = document.head.getAttribute('data-runid');

var isIframe = parent.document != document;

var logData = [];
var logTimeout = 0;

function logToParent(message) {
    logData.push(message);
    clearTimeout(logTimeout);
    if (logData.length > 5 || message[1] == 'runtimeError') {
        if (isIframe)
            parent.postMessage(logData, '*');
        logData = [];
    }
    else {
        logTimeout = setTimeout(function() {
            if (isIframe)
            parent.postMessage(logData, '*');
            logData = [];
        },2000);
    }
}

function logEvent(event, args, loc, globals) {
    logToParent([Date.now(), 'element',
        event.currentTarget.outerHTML.replace(/>.*/, '>'), event.type,
        args.callee.name, !!args.callee.caller, Array.from(args),loc, globals]);
}

logToParent([Date.now(),'runid', runid]);

window.prompt = function() {
    var result = origPrompt.apply(this, arguments);
    logToParent([Date.now(), 'prompt', result, Array.from(arguments)]);
    return result;
}

window.alert = function() {
    logToParent([Date.now(), 'alert', Array.from(arguments)]);
    origAlert.apply(this, arguments);
}

console.log = function(a) {
    logToParent([Date.now(), 'log', Array.from(arguments)]);
    origLog.apply(this, arguments);
}

var observer = new MutationObserver(function (mr) {
    mr.forEach(function(e) {
        switch (e.type) {
            case 'childList':
                var addedNodes = Array.from(e.addedNodes).map((x) => (x.innerHTML||x.textContent).substring(0,50));
                var removedNodes = Array.from(e.removedNodes).map((x) => (x.innerHTML||x.textContent).substring(0,50));
                logToParent([Date.now(), 'mutation', e.type, e.target.outerHTML.replace(/>.*/,'>'), addedNodes, removedNodes]);
                break;
            case 'attributes':
            case 'characterData':
            default:
        }
    });
});
// observer.observe(document, {childList: true,
//     attributes: true,
//     characterData: true,
//     subtree: true,
//     attributeOldValue: true,
//     characterDataOldValue: true
// });
