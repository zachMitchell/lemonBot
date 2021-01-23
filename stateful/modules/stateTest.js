function joinCheck(stateData){
    if(stateData.a == 10)
        return { joinable:false, reason:'youbadlol' };
    else return { joinable:true };
}

function leaveCheck(stateData,m){
    if(stateData.b == 10)
        return {leavable:false, reason:"YOU'RE STUCK HERE FOREVER NOOB - MUAHAHAHAHA."}
    
    else if(stateData.b == 20){
        m.channel.send('End all has been triggered, therefore everybody will disbanded from the session');
        return { leavable: true, endAll: true}
    }
    else return { leavable:true }
}

//In this example I'm just parsing arguments and assigning them to state data.
function onFind(stateData, member, msg, args){
    //parse arguments. They will be specific since this is just an example.
    for(var i = 0; i < args.length; i+=2){
        if(args[i] && args[i+1]){
            //Check if a dash is in front of the variable
            if(args[i][0] == '-'){
                stateData.rootInfo[args[i].slice(1)] = args[i+1]
                msg.channel.send('rootObj.'+args[i].slice(1)+' = '+args[i+1]);
            }

            else{
                stateData[args[i]] = args[i+1];
                msg.channel.send('stateData.'+args[i]+' = '+args[i+1]);
            }
        }
        else if(args[i]){
            if(args[i][0] == '-')
                msg.channel.send('result:' + stateData.rootInfo[args[i].slice(1)]);
            else msg.channel.send('result:' + stateData[args[i]]);
        }
    }

}

module.exports = {
    cmd:'state',
    joinCheck:joinCheck,
    onFind:onFind,
    expires:-1
}