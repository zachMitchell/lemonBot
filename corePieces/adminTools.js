function isAdmin(m,sendErrMsg = true){
    //First off we need the author's ID
    var userId = m.author.id;
    var admin = false;

    //poll through all roles
    for(var i of m.channel.guild.roles.cache){
        if(i[1].permissions.has('ADMINISTRATOR')){
            //We got a juicy one, now check if said user is in this role
            for(var j of i[1].members){
                if(j[1].user.id == userId){
                    admin = true;
                    break;
                }
            }
            if(admin) break;
        }
    }

    if(!admin && sendErrMsg) sendErr(m);
    return admin;
}

function sendErr(m,msg = ''){
    m.reply(msg?msg:'Sorry, it looks like only Admins can use this command!');
}

function queryMessages(m,quantity,phraseList,doneFunc = ()=>{}){
    m.channel.messages.fetch({limit:quantity}).then(e=>{
        var userIds = [];
        for(var i of m.mentions.users.keys())
            userIds.push(i);

        doneFunc(e.filter(msg=> (userIds.length?userIds.indexOf(msg.author.id) > -1:true) && (phraseList.length? phraseList.map(e=>msg.content.indexOf(e) > -1).indexOf(true) > -1 :true) ));
    });
}

module.exports = {
    isAdmin:isAdmin,
    queryMessages:queryMessages
}