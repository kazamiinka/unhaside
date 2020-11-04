//console.log(Date.now(), 'run');

const spellRuntime = {};

spellRuntime.origPrompt = window.prompt;
spellRuntime.origAlert = window.alert;
spellRuntime.origLog = console.log;
spellRuntime.origError = console.error;

spellRuntime.runid = document.head.getAttribute('data-runid');

spellRuntime.isIframe = parent.document != document;

spellRuntime.logData = [];
spellRuntime.logTimeout = 0;
spellRuntime.globalVars = () => {return {};};

spellRuntime.logToParent = function(message) {
    spellRuntime.logData.push(message);
    // spellRuntime.origLog('logdata', spellRuntime.logData);
    clearTimeout(spellRuntime.logTimeout);
    if (spellRuntime.logData.length > 5 || message[1] == 'runtimeError' || message[1] == 'domError' || message[1] == 'log') {
        if (spellRuntime.isIframe)
            parent.postMessage(spellRuntime.logData, '*');
        spellRuntime.logData = [];
    }
    else {
        spellRuntime.logTimeout = setTimeout(function() {
            if (spellRuntime.isIframe)
                parent.postMessage(spellRuntime.logData, '*');
            spellRuntime.logData = [];
        },1000);
    }
}

spellRuntime.logEvent = function(event, args, loc, startOrEnd) {
    spellRuntime.logToParent([Date.now(), 'element',
        event.currentTarget.outerHTML.replace(/>.*/, '>'), startOrEnd, event.type,
        args.callee.name, (args.callee.caller ? args.callee.caller.name || null : false ), Array.from(args),loc, spellRuntime.globalVars(), spellRuntime.inputs()]);
}

spellRuntime.logToParent([Date.now(),'runid', spellRuntime.runid]);

window.prompt = function() {
    var result = spellRuntime.origPrompt.apply(this, arguments);
    spellRuntime.logToParent([Date.now(), 'prompt', result, Array.from(arguments), spellRuntime.globalVars(), spellRuntime.inputs()]);
    return result;
}

window.alert = function() {
    spellRuntime.logToParent([Date.now(), 'alert', Array.from(arguments), spellRuntime.globalVars(), spellRuntime.inputs()]);
    spellRuntime.origAlert.apply(this, arguments);
}

window.onerror = function() {
    // parent.postMessage(['__displaynow', Date.now(), 'domError', Array.from(arguments).map((e) => String(e))]);
    spellRuntime.logToParent([Date.now(), 'domError', Array.from(arguments).map((e) => String(e))]);
}
console.log = function(a) {
    // parent.postMessage(['__displaynow', Date.now(), 'log', Array.from(arguments).map((e) => String(e))]);
    spellRuntime.logToParent([Date.now(), 'log', Array.from(arguments), spellRuntime.globalVars(), spellRuntime.inputs()]);
    spellRuntime.origLog.apply(this, arguments);
}

// console.error = function(a) {
//     parent.postMessage(['__displaynow', Date.now(), 'error', Array.from(arguments).map((e) => String(e))]);
//     // spellRuntime.logToParent([Date.now(), 'log', Array.from(arguments), spellRuntime.globalVars(), spellRuntime.inputs()]);
//     spellRuntime.origError.apply(this, arguments);
// }

spellRuntime.inputs = function() {
    try {
        return Array.from(document.getElementsByTagName('input'))
        .map((e) => {
            return {
                // tag: e.outerHTML.replace(/>.*/,'>'),
                type: e.getAttribute('type'),
                name:  e.getAttribute('name'),
                id:  e.getAttribute('id'),
                value: e.value,
                checked: e.checked
            };
        })
    }
    catch(e) {
        return [];
    }
}

spellRuntime.observer = new MutationObserver(function (mr) {
    spellRuntime.origLog(mr);
    mr.forEach(function(e) {
        switch (e.type) {
            case 'childList':
                var addedNodes = Array.from(e.addedNodes).map((x) => (x.innerHTML||x.textContent).substring(0,50));
                var removedNodes = Array.from(e.removedNodes).map((x) => (x.innerHTML||x.textContent).substring(0,50));
                spellRuntime.logToParent([Date.now(), 'mutation', e.type, e.target.outerHTML.replace(/>.*/,'>'), addedNodes, removedNodes]);
                break;
            case 'attributes':
            case 'characterData':
            default:
        }
    });
});

// spellRuntime.observer.observe(document, {childList: true,
//     attributes: true,
//     characterData: true,
//     subtree: true,
//     attributeOldValue: true,
//     characterDataOldValue: true
// });
