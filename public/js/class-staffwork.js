const classId = location.pathname.split('/').pop();
let startLogTime = 0 // Date.now() - 1*3600*1000; // 3 hours ago

const classMap = {}

function classLayout(ipaddr, zmac) {
    // ip address to col, row
    for (var i = 0; i < 40; ++i) {
        classMap[`133.27.24.${i+ipaddr}`] = ['zmac' + String(i + zmac).padStart(3, '0'), 1 + Math.floor(i/10) % 4, 1 + i % 10];
    }
}
classLayout(75, 41); // epsilon '133.27.24.75': ['zmac041', 1, 1], '133.27.24.85': ['zmac051', 2, 1],
classLayout(203, 121); // omnicron '133.27.24.203': ['zmac121', 1, 1],

// https://momentjs.com/docs/#/customization/relative-time/
moment.updateLocale('en', {
    relativeTime: {
        s: 'just now',
        ss: '%d secs',
        m: '1 min',
        mm: '%d mins',
        h: '1 hour',
        d: '1 day',
        M: '1 month',
        y: '1 year'
    }
});

const thisUserId = $('.page-header').data('user-id');
const thisClassId = $('.page-header').data('class-id');

let classData;

let socket = io({
    transports: ['websocket', 'poll']
});

// socket.on('rank', (rankData) => {
//     console.log('rank', rankData);
// });

socket.on('action', (message) => {
    console.log('action', message);
    // var deskEl = $(`.room-colrow-${message.logs[0].col}-${message.logs[0].row}`);
    // if (message.logs[0].action == 'start') {
    //     deskEl[0].dataset.handler = message.userId;
    //     if (message.userId == thisUserId) {
    //         deskEl.addClass('handled-self').removeClass('handled-other');
    //     }
    //     else
    //         deskEl.addClass('handled-other').removeClass('handled-self');
    // }
    // if (message.logs[0].action == 'finish') {
    //     deskEl[0].dataset.handler = '';
    //     deskEl.removeClass('handled-other').removeClass('handled-self');
    // }
});

var res;
socket.on('connect', async () => {
    // res = await initializeLogs();
    socket.emit('join', {
        type: 'staff',
        classId: thisClassId
    });
    socket.emit('get-rank', thisClassId);
});

var layout
const rankClass = (r) => r >= .75 ? 'lightcoral' : (r >= .5 ? 'lightsalmon' : (r >= .25 ? 'lightyellow' : 'whitesmoke'));
socket.on('rank', async (message) => {
    layout = message.ranks.map((desk) => {
        desk.location = classMap[desk.latestUpdate.find((d) => d.key == 'client-addr').value];
        if (desk.location) {
            let deskEl = `.room-colrow-${desk.location[1]}-${desk.location[2]}`;
            $(deskEl).data('student', desk.id).css('background-color', rankClass(desk.rankTest[0]/message.ranks.length));
            $(`${deskEl} .hostname`).text(desk.location[0]);
            $(`${deskEl} .username`).text(desk.key.replace(/@.+/,''));
            $(`${deskEl} .latest-work`).text(desk.rankWork[1] ? 'W: '+desk.rankWork[1] : '');
            $(`${deskEl} .latest-run`).text(desk.rankRun[1] ? 'R: '+desk.rankRun[1] : '');
            $(`${deskEl} .latest-test`).text(desk.rankTest[1] ? 'T: '+desk.rankTest[1] : '');
            // console.log(desk.key.replace(/@.+/,''), rankClass(desk.rankTest[0]/message.ranks.length))
        }
        return desk;
    })
})

// test display
/*
setInterval(function () {
    const zeroArray = (new Array(40)).fill(0);
    var randomRank = zeroArray.map((x, i) => i + 1).sort(() => Math.random() - Math.random());
    var singleData = (ipaddr, rank) => {
        return {
            "key": "student2",
            "id": "5bdb9e4c63f5486ae9497974",
            "latestUpdate": [{
                "key": "exercise",
                "value": "06-01"
            }, {
                "key": "tests right-align",
                "value": 2
            }, {
                "key": "errors right-align red-error",
                "value": 3,
                "title": "Hello, world!; Hello, Taro!; Hello, Hanako!"
            }, {
                "key": "client-addr",
                "value": `133.27.24.${ipaddr+75}`
            }, {
                "key": "update-time",
                "title": "2018-11-05T05:45:11.956Z",
                "value": "10 hours"
            }],
            "rankTest": [rank, "06-01"],
            "rankRun": [rank, "06-01"],
            "rankWork": [rank, "06-02"]
        }
    };

    zeroArray.forEach((m, i) => {
        desk = singleData(i, randomRank[i]);
        desk.location = classMap[desk.latestUpdate.find((d) => d.key == 'client-addr').value];
        if (desk.location) {
            let deskEl = `.room-colrow-${desk.location[1]}-${desk.location[2]}`;
            $(deskEl).data('student', desk.id).css('background-color', rankClass(desk.rankTest[0]));
            $(`${deskEl} .hostname`).text(desk.location[0]);
            $(`${deskEl} .username`).text(desk.key.replace(/@.+/,''));
            $(`${deskEl} .latest-work`).text(desk.rankWork[1] ? 'W: '+desk.rankWork[1] : '');
            $(`${deskEl} .latest-run`).text(desk.rankRun[1] ? 'R: '+desk.rankRun[1] : '');
            $(`${deskEl} .latest-test`).text(desk.rankTest[1] ? 'T: '+desk.rankTest[1] : '');
        }
    })

}, 3000);
*/

// $('.room-desk').click(function() {
//     var row = this.dataset.rowNo;
//     var col = this.dataset.colNo;
//     socket.emit('action', {classId: thisClassId, userId: thisUserId, logs:[{row, col}]});
// });

$('.room-desk').on('tap', function (e, data) {
    var row = this.dataset.rowNo;
    var col = this.dataset.colNo;
    var assistCount = this.dataset.assistCount || 0;
    this.dataset.assistCount = ++assistCount;
    console.log('tap', row, col, assistCount);

    $('.room-desk').removeClass('assist-self');
    $(this).addClass('assist-self');
    socket.emit('action', {classId: thisClassId, userId: thisUserId, logs:[{student: $(this).data('student'), row, col, action: 'start'}]});

    // if (handler && handler != thisUserId)
    //     return;
    // if (handler && handler == thisUserId) {
    //     socket.emit('action', {classId: thisClassId, userId: thisUserId, logs:[{row, col, action: 'finish'}]});
    //     this.dataset.handler = '';
    //     isHandling = null;
    // }
    // if (!handler) {
    //     if(isHandling) {
    //         socket.emit('action', {classId: thisClassId, userId: thisUserId, logs:[{row:isHandling.row, col:isHandling.col, action: 'finish'}]});
    //         $(`.room-colrow-${isHandling.col}-${isHandling.row}`).data('handler','');
    //     }
    //     socket.emit('action', {classId: thisClassId, userId: thisUserId, logs:[{row, col, action: 'start'}]});
    //     this.dataset.handler = thisUserId;
    //     isHandling = {row, col};
    // }
});


// $('.x-room-desk').on('longtap', function(e, data) {
//     var row = this.dataset.rowNo;
//     var col = this.dataset.colNo;
//     var handler = this.dataset.handler;
//     console.log('tap', row, col, handler);
//     if (handler && handler != thisUserId) {
//         socket.emit('action', {classId: thisClassId, userId: handler, logs:[{row, col, action: 'finish', force: thisUserId}]});
//         this.dataset.handler = '';
//     }
//     if (handler && handler == thisUserId) {
//         socket.emit('action', {classId: thisClassId, userId: thisUserId, logs:[{row, col, action: 'finish'}]});
//         this.dataset.handler = '';
//         isHandling = null;
//     }
//     if (!handler) {
//         if(isHandling) {
//             socket.emit('action', {classId: thisClassId, userId: thisUserId, logs:[{row:isHandling.row, col:isHandling.col, action: 'finish'}]});
//             $(`.room-colrow-${isHandling.col}-${isHandling.row}`).data('handler','');
//         }
//         socket.emit('action', {classId: thisClassId, userId: thisUserId, logs:[{row, col, action: 'start'}]});
//         this.dataset.handler = thisUserId;
//     }
// });