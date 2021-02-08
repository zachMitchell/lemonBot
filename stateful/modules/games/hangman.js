//Made by Zachary Mitchell in 2021!
//A long time ago there used to be this flash hangman game called "hangman.no". It's gone now, but discord is a new canvas, so this could probably last longer.
const {quoteParser} = require('../../../corePieces/mentionTools'),
    hangmanWords = require('./hangmanWords.json'),
    messages = {
    joined:'New game of hangman! use `help` (e.g `/hangman help`) to see the rules',
    quickStart:'Quick Start: use || to create a word/phrase for everyone else to guess `||my thing goes here!||` or just add `rnd` and a word will be randomly selected',
    alreadyTried:'that was already used!',
    hostEnd:'[The host has left the game]'
}
    //Hats, heads, shirts, pants and shoes to draw a hangman.
    hangmanEmoji = [
    ['🎩','🧢','🪖','🕶️','🥽','👑'],
    ['😒','😑','🤯','🥸','🤦‍♂️','😵‍💫','😵'],
    ['🧥','👔','👕','🥼'],
    ['🩳','👖'],
    ['🧦','👞','👟','🥾']
],
    noMiss = '🟩',
    renderers = {
    headerInfo:function(stateData){
        var result = '',

        var joinIdentifier = stateData.rootInfo.host ? '<@'+stateData.rootInfo.host.userId+'>' : stateData.rootInfo.pass;
        //Expires & join message:
        result+='\nGame expires `5 minutes` after last move\nTo join: `/join` '+joinIdentifier+' OR: "<@'+stateData.lMsg.client.user.id+'> '+ joinIdentifier+'" \nPasscode: `'+stateData.rootInfo.pass+'`';

        return result;
    },
    board:function(gameObj){
        var result = '';

        return result;
    },
    log:function(gameLog){
        var result = '```\n';
        for(var i = 0; i < gameLog.length; i++)
            result += gameLog[i] + '\n' + (i != gameLog.length - 1 ? '---' : '') + '\n';

        return result+'```';
    }
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

function game(host,word,hint){
    this.host = host,
    this.word = word.replaceAll('_','-'),
    this.hint = hint,
    this.wordProgress = [], //This will store every letter that has been discovered so far.
    this.hangman = []; //Randomly selected emoji sprites. When this is filled up it's game over.
    this.guesses = [];

    //Automatically fill in symbols and spaces; that would be really hard to guess :P
    for(var i in this.word){
        var targetChar = this.word[i].toLowerCase();
        if(!isNaN(targetChar) || (targetChar.charCodeAt(0) > 96 && targetChar.charCodeAt(0) < 123 ))
            this.wordProgress[i] = undefined; //Different from an empty array slot. This will help us track if the word is complete
        else this.wordProgress[i] = targetChar;
    }
}

game.prototype.guess = function(str){
    //Is the player guessing an entire phrase? compare it with the original word, and put it in guesses if incorrect:

    //First check to see if this item was already guessed
    if(this.guesses.indexOf(str) > -1)
        return 'alreadyGuessed';

    if(str.length > 1){
        if(str.toLowerCase() == this.word.toLowerCase())
            return 'wordCorrect';
        else{
            this.guesses.push(str);
            return false;
        }
    }

    //This assumes the string is a single letter/number
    if(this.word.toLowerCase().indexOf(str) == -1){
        this.guesses.push(str);
        return false;
    }
    else{
        //We found a letter, we need to fill in every related space based on this.word
        for(var i in this.word)
            if(this.word[i].toLowerCase() == str) this.wordProgress[i] = this.word[i];

        this.guesses.push(str);
        return true;
    }
}

//If we don't have any undefined's, the game was won:
game.prototype.winCheck = function(){
    return this.wordProgress.indexOf(undefined) != -1;
}

//Append a hangman piece to the game, if we hit a maximum piece size, the game is over
game.prototype.wrongStrike = function(){
    var targetEmoji = hangmanEmoji[this.hangman.length];
    this.hangman.push(targetEmoji[Math.floor(Math.random()) * targetEmoji.length]);

    //True is a game over
    if(this.hangman.length == hangmanEmoji.length)
        return true;

    //Nothing returned is considered false and the game progresses.
}

//Stateful functions
////////////////////
function joinCheck(stateData){}

function leaveCheck(stateData,m){}

function onFind(stateData, member, msg, args){
    stateData.lMsg = msg;

    if(!stateData.gameStarted){
        if(!stateData.game){
            //Initialize game data.
            
        }

        return;
    }

    //Go through the game routine
}

function onEnd(stateData,m,reason){}

module.exports = {
    cmd:'hangman',
    joinCheck:joinCheck,
    onFind:onFind,
    onEnd:onEnd,
    leaveCheck:leaveCheck,
    expires:60*5
}