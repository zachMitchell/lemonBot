//Made by Zachary Mitchell in 2021!
//Mastermind is a game I got for Christmas. The rules are extremely simple, but in this version instead of pegs, we'll use numbers.
const shuffle = require('../../../lemonModules/shuffle'),
    messages = {
    newGame:'New game of mastermind! For help: `/mmind help`. Start a new game with a random number (`rnd`) or put in your own number! (`||1234||`)',
    hostEnd:'[The host has left the game]',
    onlyNumbers:'Sorry, the game only takes in numbers 4 digits, each being 1 through 6! (For a random game, just type "rnd" without the `||`)',
    shortNumber:'Looks like the number is too short, 4-digits please! (Numbers 1-6)',
    hostGuess:'Sorry, but you can\'t guess your own code :(',
    rndNumber:'The computer randomly generated a number for you... good luck decoding!',
    userNumber:'The host made a number... for everyone else, good luck decoding!',
    noHostSetup:"The host hasn't set up the game yet...",
    gameLose:"Bummer... the code wasn't cracked...",
    crackedCode:"cracked the code!",
    gameOver:"Game over; this session will now end.",
    sessionExpired:'Dow... looks like this session expired >~<',
    helpPage:`How to play mastermind!

    * You are an 1337 hAX0r trying to guess a secret code... either from the computer or a human opponent!
    * The codes themselves have numbers 1 through 6 in them and have 4 digits.
    * If you put a number in the right spot, you will earn a 🟥!
    * If you have a correct number, but it's not in the right spot, you you will get a ⬜
    * The squares above don't have to be in the order of the code, so a fourth red square does *not* mean digit 4 is exact; it means any one of the four digits were placed correctly.
    * You can have more than 1 of the same number! For example the code can be all 1's or all 5's... don't shy away from spicing things up!
    * Find the code before you make 10 guesses!
    * Get 4 🟥 to win!
    
    Setting up & Playing:
    * To ask for a random number, use: \`/mmind rnd\`
    * If you are the host, surround your code with \`||\` to start a game! (you can't guess your own code) (e.g \`/mmind ||1234||\`)
    * To guess a code, type your guess down like this: \`/mmind 1234\`
    `
},
    numberSprites = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣'],
    progressPegs = ['⬜','🟥'],
    renderers = {
    headerInfo:function(stateData){
        var result = '',
        joinIdentifier = stateData.rootInfo.host ? '<@'+stateData.rootInfo.host.userId+'>' : stateData.rootInfo.pass;
        
        //Expires & join message:
        result+='\nGame expires `5 minutes` after last move\nTo join: `/join` '+joinIdentifier+' OR: "<@'+stateData.lMsg.client.user.id+'> '+ joinIdentifier+'" \nPasscode: `'+stateData.rootInfo.pass+'`';

        return result;
    },
    board:function(gameObj){
        var result = '';
        //End early if we have no game data.
        if(!gameObj) return result;
        result+='Tries left: '+ (10 - gameObj.length)+'\n';

        for(var i of gameObj){
            for(var j in i[0])
                result+=numberSprites[i[0][j]-1];
            
            result += " ";
            for(var j = 0; j < 4;j++)
                if(typeof i[1][j] == 'number') result+=progressPegs[i[1][j]];
            result+="\n";
        }

        return result;
    },
    log:function(gameLog){
        var result = '```\n';
        for(var i = 0; i < gameLog.length; i++)
            result += gameLog[i] + '\n' + (i != gameLog.length - 1 ? '---' : '') + '\n';

        return result+'```';
    }
}

//Mastermind takes in numbers with 6 digits, with each number being 1 through 6. If it doesn't follow this criteria, we return false.
function validNumber(str){
    if(isNaN(str) || str.length < 4) return false;
    for(var i of str) if(i < 1 || i > 6) return false;

    return true;
}

function gradeGuess(str,answer){
    var result = [str,[]],
        redPoints = 0,
        numberQuantities = [0,0,0,0];

    //How many of each number do we have?
    for(var i in answer) numberQuantities[answer[i] - 1] ++;

    for(var i in str){
        if(str[i] == answer[i]){
            result[1][i] = 1;
            redPoints++;
        }
    }

    //Cut the check short, the player won!
    if(redPoints == 4){
        result.push(true);
        return result;
    }

    //Check the accuracy, if the player placed a correct number somewhere in the sequence but not in the right spot, that's a white peg.
    for(var i = 0;i < 4;i++){
        for(j = 0; j < 4; j++){
            if(str[i] == answer[j] && !result[1][j] && numberQuantities[str[i] - 1]){
                result[1][j] = 0;
                numberQuantities[str[i] - 1] --;
                break;
            }
        }
    }

    //Shuffle the pins around last minute so the order doesn't determine where pieces should go
    shuffle(result[1]);

    return result;
}

//In the event we need to draw a new message to play the game, just create a new message.
function drawGame(board,stateData,newMessage = false){
    var resultStr = renderers.headerInfo(stateData) + '\n' + renderers.board(board) + '\n' + renderers.log(stateData.log);
    var thenFunction = e=>stateData.gameMsg = e;

    //I tried calling this as a function that's either channel.send or .edit; but they had to be split because the prototype for both messages appear to have scope issues
    if(newMessage) stateData.lMsg.channel.send(resultStr).then(thenFunction);
    else stateData.gameMsg.edit(resultStr).then(thenFunction)
}

function logPush(gameLog, text = ''){
    gameLog.push(text);
    //Remove a previous entry if the log is bigger than 3 messages
    if(gameLog.length > 3)
        gameLog.shift();
}

//Stateful functions
////////////////////
function joinCheck(stateData,msg){
    logPush(stateData.log,msg.author.username+' joined the game!');
    return {joinable:true}
}

function leaveCheck(stateData,m){
    if(m.author.id == stateData.rootInfo.host.userId){
        logPush(stateData.log,messages.hostEnd);
        onEnd(stateData,m,'hostEnd');
        return {leavable: true, endAll: true}
    }
    else{
        logPush(stateData.log,msg.author.username+' left the game.');
        return {leavable: true}
    }
}

function onFind(stateData, member, msg, args){
    stateData.lMsg = msg;
    var usageHit = false;

    if(isNaN(args[0])){
        switch(args[0]){
            case "redraw":
                if(member == stateData.rootInfo.host)
                    drawGame(stateData.progressArray,stateData,true);
                return {cooldownHit:true};
            case "help":
                msg.channel.send(messages.helpPage);
                //If the player triggered this without necessarily starting a game, this happens.
                if(!stateData.gameMsg) onEnd(stateData,msg);
                return {cooldownHit:true};
        }
    }

    if(!stateData.progressArray){
        if(member == stateData.rootInfo.host){
            if(!stateData.log) stateData.log = [messages.newGame];
            var targetNumber = "";
            //Take in the first argument:
            if(args && args[0] && args[0].indexOf('||') == 0){
                var argStr = args[0].split('||')[1];
                if(isNaN(argStr)) logPush(stateData.log,msg.author.username+': '+messages.onlyNumbers);
                else if(argStr.length < 4) logPush(stateData.log,msg.author.username+': '+messages.shortNumber);
                else if(!validNumber(argStr)) logPush(stateData.log,msg.author.username+': '+messages.onlyNumbers);
                else{
                    targetNumber = argStr;
                    logPush(stateData.log,messages.userNumber);
                }
            }
            else if(args[0] == 'rnd'){
                for(var i = 0;i<4;i++)
                    targetNumber+=(Math.floor(Math.random()*6) + 1);
                stateData.rndNumber = true;
                logPush(stateData.log,messages.rndNumber);
            }

            //Initialize game data!
            if(targetNumber){
                stateData.progressArray = [];
                stateData.answer = targetNumber;
            }
            //That was easy!
        }
        else if(args && args[0]) logPush(stateData.log,msg.author.username+': '+messages.noHostSetup);

        drawGame(undefined,stateData,!stateData.gameMsg);
        usageHit = true;
    }
    else{
        //Game flow
        if(args[0]){
            if(member == stateData.rootInfo.host && !stateData.rndNumber){
                logPush(stateData.log, msg.author.username+': '+messages.hostGuess);
                drawGame(stateData.progressArray,stateData);
                return {cooldownHit:true};
            }
            //Routine check if the number is valid
            else if(!validNumber(args[0])){
                logPush(stateData.log,messages.onlyNumbers);
                drawGame(stateData.progressArray,stateData);
                return {cooldownHit:true};
            }
            
            //Go through the game check to see what score the player got. This array will have game data on the first index, and weather the game was won on the second index.
            var resultEntry = gradeGuess(args[0],stateData.answer);
            stateData.progressArray.push(resultEntry);
            if(resultEntry[2]){
                //The player has won!
                logPush(stateData.log,msg.author.username+' '+messages.crackedCode);
                onEnd(stateData,msg);
                return {endAll:true};
            }
            else logPush(stateData.log,msg.author.username+': '+args[0]);

            if(stateData.progressArray.length == 10){
                logPush(stateData.log,messages.gameLose);
                onEnd(stateData,msg);
                return {endAll:true};
            }
        }

        drawGame(stateData.progressArray,stateData);
    }
    msg.delete();
    if(usageHit) return {cooldownHit: true}
}

function onEnd(stateData,m,reason){
    if(stateData.gameMsg){
        if(reason == 'sessionExpire') logPush(stateData.log,messages.sessionExpired);
        if(stateData.answer) logPush(stateData.log,"Answer: "+stateData.answer);
        logPush(stateData.log,messages.gameOver);
        drawGame(stateData.progressArray,stateData);
    }
}

module.exports = {
    cmd:'mmind',
    helpText:'Mastermind: A game of logic to crack the code of your opponent!',
    joinCheck:joinCheck,
    onFind:onFind,
    onEnd:onEnd,
    leaveCheck:leaveCheck,
    expires:60*5
}