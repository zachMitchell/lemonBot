//Made by Zachary Mitchell in 2021!
/*This file will be responsible for wiring all files together. The way it's wired is up to the dev
weather that be just linking the files directly or searching for file syntax.
In this case I'm using a hint of both.*/

var fileList = [];
var moduleResults = {};

fileList.push('./modules/stateTest','./modules/games/tictactoe','./modules/games/hangman','./modules/games/mastermind');

//import all listed modules
for(var i of fileList){
    var targetModule = require(i);
    moduleResults[targetModule.cmd] = targetModule;
}
module.exports = moduleResults;