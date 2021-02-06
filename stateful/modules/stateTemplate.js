//Stripped-down template for statefull commands based on stateTest.js
function joinCheck(stateData){}

function leaveCheck(stateData,m){}

function onFind(stateData, member, msg, args){}

function onEnd(stateData,m,reason){}

module.exports = {
    cmd:'nameHere',
    joinCheck:joinCheck,
    onFind:onFind,
    onEnd:onEnd,
    leaveCheck:leaveCheck,
    expires:60*5
}