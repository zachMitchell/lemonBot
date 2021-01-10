//Made by Zachary Mitchell in 2020!
//Routine functions that could be used in more than one file.

//Takes a list of items with this format "HEY_THERE" and converts it to "Hey There"
function underScoreDeCap(){
    var results = [];
    for(var i of arguments){
        var resStr = '';
        for(var j of i.split('_'))
            resStr += (resStr.length?' ':'') + j[0].toUpperCase() + j.substring(1).toLowerCase();
        
        results.push(resStr);
    }
    
    return results;
}

//If the user that sent the message has the correct permissions, return true
//useOr will cause this to return true if you have at least one permission
function checkPerms(m,permsList = [],useOr = false ,printErr = true){
    var endResult = true;
    var permsResults = {
        good:[],
        bad:[]
    }

    if(!permsList.length){
        console.warn('No permissions specified, returning true...');
        return endResult;
    }

    for(var i of permsList)
        permsResults[m.member.permissions.has(i)?'good':'bad'].push(i);

    // console.log(permsList,permsResults);
    
    if(useOr && !permsResults.good.length || !useOr && permsResults.bad.length)
        endResult = false;
    
    if(!endResult && printErr)
        printPermsErr(m,permsResults);

    return [endResult,permsResults];
}

function printPermsErr(m,permsResults){
    var haveStr = permsResults.good.length? '\nYou have: `'+underScoreDeCap(...permsResults.good)+'`':'';
    m.reply('Sorry, but it looks like you need more permissions to run this command..'+haveStr+"\nYou need: `"+ underScoreDeCap(...permsResults.bad)+'`');
}

function queryMessages(m,quantity,phraseList,doneFunc = ()=>{}){
    m.channel.messages.fetch({limit:quantity}).then(e=>{
        var userIds = [];
        for(var i of m.mentions.users.keys())
            userIds.push(i);

        doneFunc(e.filter(msg=> (userIds.length?userIds.indexOf(msg.author.id) > -1:true) && (phraseList.length? phraseList.map(e=>msg.content.indexOf(e) > -1).indexOf(true) > -1 :true) ));
    });
}

//Simple polling function to find a target channel based on the string name
function queryChannel(m,channelName,type = 'text',printErr = true){
    
    var targetChannel;

    for(var i of m.channel.guild.channels.cache){
        if(i[1].name == channelName && i[1].type == type){
            targetChannel = i[1];
            break;
        }
    }

    if(!targetChannel){
        if(printErr)
            m.reply('*Error: Couldn\'t find that '+type+' channel :/ ('+channelName+')*');
    }
    else return targetChannel;
}

module.exports = {
    checkPerms:checkPerms,
    printPermsErr:printPermsErr,
    queryMessages:queryMessages,
    queryChannel:queryChannel
}