//Made by Zachary Mitchell in 2021!

const { cool } = require("../../../corePieces/emoji");

//One of the first video games was tictactoe on a mainframe machine. I don't have one of those though, so this will be through discord instead
var messages = {
    joined:' joined as ',
    moved: ' placed piece in slot ',
    notice:'*Note* - Even if all players leave the game, it will remain open. To end the game early, join the game and respond with "end" instead of a number.',
    gameStart:['Game start! ',' goes first.'],
    gameOver: 'Game Over; this session will now end.',
    secondPlayer: 'Waiting for a second player...',
    endEarly:'[The host has requested to end the game]',
    endEarlyDeny:'Sorry, only the host can end the game :/',
    invalidNumber:'The number needs to be numbers 1 through 9 :)',
    takenPlace: 'Whoops, that was already used! try again',
    help: 'For help, type: /tttoe help',
    notYourTurn:[
        "It's not your turn!",
        "Not your turn yet!",
        "...buddy... it ain't your turn yet",
        "...nnnnope, still not your turn",
        "DUDE, IT'S NOT YOUR TURRRRRN",
        "WHYYYYYYYY",
        "UUUUUUUUHG",
        ";aklsd;fkjpq983wu;klzdnfpoiuqw",
        "I take it at this point you're doing this just for giggles -_-*",
        "A wise guy once said \"Big Dumb\"",
        "I got an idea",
        "What if this text looped FOREVER? MUAHAHAHAHA"
    ]
}

//Board pieces in emoji form
var pieces = {
    x:'❌',
    o:'⭕'
}

//This is used to quickly access the pieces above.
var xoArray = ['x','o'],
//emoji for slots not filled in yet
    emptySlots = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'],
    currentTurn = '🎮', //Shows next to a username when it's their turn
    winnerPiece = '👑';
var helpText = `How to play tic-tac-toe!

* When its your turn, ${currentTurn} will show up next to your name
* On your turn, use a number from 1 to 9 to place down your marking!
* Get 3 of your markings in a row on the board to win! ${winnerPiece} (Horizontally, vertically, diagonally)
* The host is always ${pieces.x}
* Use \`/leave\` to exit the game so someone else can take your place

**Instead of a number**
* Type \`end\` (Host only) to quit the game early
* Type \`redraw\` to display the game on a new message
* To see this message again, use \`help\``;

const renderers = {
    headerInfo:function(stateData){
        var result = '',
            playerData = stateData.game.players;

        //Player list
        for(var i in playerData)
            result+= (i > 0 ? '\n' : '') + pieces[xoArray[i]] + ' - ' + (playerData[i] ? playerData[i].username: '???') + (stateData.game.currentTurn == i ? (stateData.game.winner? winnerPiece : currentTurn) : '');

        var joinIdentifier = stateData.rootInfo.host ? '<@'+stateData.rootInfo.host.userId+'>' : stateData.rootInfo.pass;
        //Expires & join message:
        result+='\nGame expires `5 minutes` after last move\nTo join: `/join` '+joinIdentifier+' OR: "<@'+stateData.lMsg.client.user.id+'> '+ joinIdentifier+'" \nPasscode: `'+stateData.rootInfo.pass+'`';

        return result;
    },
    board:function(boardArray){
        var result = '';
        for(var i = 0; i < 9; i++){
            result += boardArray[i] == undefined ? emptySlots[i] : pieces[xoArray[boardArray[i]]];

            if((i+1) % 3 != 0)
                result+='|';
            else if(i+1 != 9)
                result+='\n-------------\n';
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

//In the event we need to draw a new message to play the game, just create a new message.
function drawGame(gameData,log,stateData,newMessage = false){
    var resultStr = renderers.headerInfo(stateData) + '\n' + renderers.board(gameData.board) + '\n' + renderers.log(log);
    var thenFunction = e=>stateData.gameMsg = e;

    //I tried calling this as a function that's either channel.send or .edit; but they had to be split because the prototype for both messages appear to have scope issues
    if(newMessage) stateData.lMsg.channel.send(resultStr).then(thenFunction);
    else stateData.gameMsg.edit(resultStr).then(thenFunction)
}

function logPush(gameLog, text){
    gameLog.push(text);
    //Remove a previous entry if the log is bigger than 3 messages
    if(gameLog.length > 3)
        gameLog.shift();
}

//This does not draw a wooden log, rather it it makes a log and draws to the screen at the same time
function logDraw(stateData,text){
    logPush(stateData.log,text);
    drawGame(stateData.game,stateData.log,stateData);
}

//Game data object, it contains everything needed to fire up a game all in one go.
function gameData(playerX,playerO){
    this.board = [];
    this.players = [playerX,playerO]; //0 for X, 1 for O
    this.currentTurn = Math.floor(Math.random()*2); //Player is randomly selected to go first
    this.winner = false; //Determines weather or not to show the crown. Winner is determined by the last move.
    this.notTurnProgress = [0,0];
}

/*Look horizontally, vertically and the two diagonals to see if the current player won on their turn
Dev's note: tried to do this years ago in c++ but failed; I FREAKEN REPEATED MYSELF when trying to build this again XP
There goes an old saying from one of my friends: "Keep it simple, stupid"; well, time to accomplish that*/
gameData.prototype.playerWon = function(){
    //Horizontal
    var result = 0;
    for(var i = 0; i < 9; i++){
        if(this.board[i] === this.currentTurn) result++;
        //We have a winner!
        if(result == 3) return true;
        //going across the board once should clear the score in order to check the next row
        else if((i+1) % 3 == 0) result = 0;
    }

    delete result;

    //Vertical
    for(var i = 0;i < 3; i++){
        var result = 0;
        //Mind bender
        for(var j = 0;j < 3; j++)
            if(this.board[i+(3*j)] === this.currentTurn) result ++;
        if(result == 3) return true;
    }

    //Diagonally - manual check because there's only two to deal with
    var placements = [
        [0,4,8],
        [2,4,6]
    ]

    for(var i of placements){
        var result = 0;
        for(var j of i)
            if(this.board[j] === this.currentTurn) result++;
        if(result == 3) return true;
    }

    //As soon as we see an empty slot it's probably false
    for(var i = 0;i<9;i++)
        if(this.board[i] === undefined) return false;
    
    //If we get past the above for-loop, it's a tie:
    return 'tie';
}

//Stateful functions
////////////////////
function joinCheck(stateData,m){
    if(Object.keys(stateData.rootInfo.members).length == 2)
        return {joinable:false, reason:'Max players reached!'}
    else if(m.guild.id != stateData.lMsg.guild.id)
        return {joinable:false, reason: "This command doesn't support playing in-between discord servers"}
    else {
        //Join the game
        var playerData = stateData.game.players;
        var emptySlot = 0; //X
        if(playerData[0]) emptySlot++; // if the X slot is filled in, make it O instead
        playerData[emptySlot] = m.author;

        logPush(stateData.log,m.author.username+messages.joined+pieces[xoArray[emptySlot]]);

        if(playerData.indexOf(undefined) == -1 && stateData.initialSetup < 2){
            stateData.initialSetup++;
            logPush(stateData.log,messages.gameStart[0] + pieces[xoArray[stateData.game.currentTurn]] + messages.gameStart[1] );
        }

        //We don't set a host here, but when a member joins, they immediately launch onFind, so that will identify the host.
        if(!Object.keys(stateData.rootInfo.members).length)
            stateData.newHost = true;
        
        drawGame(stateData.game,stateData.log,stateData);
        return {joinable: true}
    }
}

function leaveCheck(stateData,m){
    //Remove traces of this user's existence
    //The state command interface takes care of if this user is present in the game.
    for(var i in stateData.game.players)
        if(stateData.game.players[i] == m.author){
            stateData.game.players[i] = undefined; //not using delete here because that reduces length
            break;
        }

    logPush(stateData.log,m.author.username + ' left the game...');
    //Deleting the host early doesn't affect the flow of the state manager:
    if(m.author.id == stateData.rootInfo.host.userId)
        delete stateData.rootInfo.host;

    //Replace the host if they leave. If nobody's around, the game is still accessible by code until expiration
    if(!stateData.rootInfo.host){
        var newHost = stateData.game.players[0] || stateData.game.players[1];
        if(newHost) stateData.rootInfo.host = newHost;
        else logPush(stateData.log,messages.notice);
        //The @mention would be replaced with the passcode until the game expires or a new host joins.
    }

    drawGame(stateData.game,stateData.log,stateData);

    return { leavable:true }
}

function onFind(stateData, member, msg, args){
    stateData.lMsg = msg; //Last message
    var cooldown = false;
    //If this state is new, create the game structure!
    //initialSetup increments everytime a step in the game setup finishes When it reaches 3: it starts to say who's turn is next. 
    if(!stateData.initialSetup){
        stateData.game = new gameData(msg.author);
        //Initial log data is always the same:
        stateData.log = [
            msg.author.username + messages.joined + pieces.x,
            messages.secondPlayer,
            messages.help
        ];

        //The "display" per-say of the game.
        stateData.gameMsg = undefined
        drawGame(stateData.game,stateData.log,stateData,true);

        stateData.initialSetup = 1;
        
        msg.delete();
    }
    else{
        //Progress the game by figuring out what the user wants to do.
        //First check if we have a number:
        if(stateData.initialSetup > 1 && !isNaN(args[0])){
            var notTurnProgress = stateData.game.notTurnProgress,
                gameTurn = stateData.game.currentTurn;
            var currPlayer = stateData.game.players[gameTurn],
                notGameTurn = !gameTurn*1;

            //If it's not your turn, print a message
            if(currPlayer != msg.author){
                logPush(stateData.log,msg.author.username+': '+ messages.notYourTurn[notTurnProgress[notGameTurn]]);
                if(notTurnProgress[notGameTurn] < messages.notYourTurn.length-1)
                    notTurnProgress[notGameTurn]++;
                else cooldown = true
            }
            //Invalid number
            else if(args[0] < 1 || args[0] > 9){
                logPush(stateData.log,currPlayer.username+': '+ messages.invalidNumber);
                cooldown = true;
            }
            else{
                //Check to see if somebody took that place on the board:
                var board = stateData.game.board;
                if(board[args[0] -1]){ //If this is already defined, there's already an entry
                    logPush(stateData.log, messages.takenPlace + ', ' + currPlayer.username);
                    cooldown = true;
                }
                else{
                    //Valid board placement over here, after inserting that onto the board, it's time to check if the player won:
                    board[args[0] -1] = gameTurn;
                    var gameOutcome = stateData.game.playerWon();
                    if(gameOutcome){
                        if(gameOutcome == 'tie')
                            logPush(stateData.log,'Tie Game >.<');
                        else{
                            logPush(stateData.log,pieces[xoArray[gameTurn]] + ' won!');
                            stateData.game.winner = true;
                        }
                        onEnd(stateData,msg,'gameFinish');
                        return { endAll:true };
                    }
                    //Just two players thankfully, this allows us to just flip a binary number and convert that to an integer.
                    else stateData.game.currentTurn = !stateData.game.currentTurn * 1;
                    logPush(stateData.log, pieces[xoArray[stateData.game.currentTurn]] + "'s turn...");
                }
            }

            drawGame(stateData.game,stateData.log,stateData);

            msg.delete();
        }

        //Otherwise, process commands here:
        switch(args[0]){
            case 'help':
                msg.reply(helpText);
                cooldown = true;
            break;
            case 'end':
                //End the game early
                if(msg.author.id == stateData.rootInfo.host.userId){
                    logPush(stateData.log,messages.endEarly);
                    onEnd(stateData,msg,'manualEnd');
                    return {endAll:true}
                }
                else logPush(stateData.log, m.author.username + ' ' + messages.endEarlyDeny);
            break;
            case 'redraw':
                drawGame(stateData.game,stateData.log,stateData,true);
                cooldown = true;
        }

        //do some work if there's no host or somebody joined:
        if(stateData.newHost){
            stateData.rootInfo.host = stateData.rootInfo.members[msg.author.id];
            stateData.newHost = false;
        }

        if(cooldown){
            msg.delete();
            return {cooldownHit:cooldown};
        }
        msg.delete();
    }
}

function onEnd(stateData,m,reason){
    if(reason == 'sessionExpired')
        logPush(stateData.log,'The session expired for this game; therefore it will now end.');
    logDraw(stateData,messages.gameOver);
}

module.exports = {
    cmd:'tttoe',
    helpText:'A casual game of tic-tac-toe, but with discord friends!',
    joinCheck:joinCheck,
    onFind:onFind,
    onEnd:onEnd,
    leaveCheck:leaveCheck,
    expires:60*5
}