//Made by Zachary Mitchell in 2021!
//lemon.js is in the process of being cleaned up. One of these things being sorted out is the responses lemonbot makes when somebody remarks with a special set of wors

const emoji = require('./emoji'),
    rndAction = require('../lemonModules/rndAction');

//Reactions are the way lemonbot responds back whether that be an emoji or a message to users.
var reactions = {
    bigDumb:[
        'brain',
        'woozy',
        'zombieF',
        'zombieM'
    ],
    hi: [
        'Howdy!',
        'hiIneedattention',
        'sup n00b',
        'Hi!',
        'Hello!',
        'salutations and the most epic of greetings to you as well.'
    ],
    jojoReference:[
        'expressionless',
        'eyeroll',
        'lying',
        'flushed'
    ],
    pog: [
        'cool',
        'mecharm',
        'moneyface',
        'starstruck'
    ],
    sadness:[
        'bigCry',
        'confounded',
        'cry',
        'frown',
        'scrunched'
    ]
};

//Lemonbot scans these and checks if the message includes the exact phrase (lower case). If this happens, lemonbot executes the respective phrase.
var responses = {
    'hi lemonbot':m=>{
        rndAction(0,e=>m.reply(e),reactions.hi);
        // console.log(m);
    },
    'pog':m=>rndAction(5,e=>m.react(emoji[e]),reactions.pog),
    'jojo reference':m=>{
        var chance = Math.floor(Math.random()*5);
        if(chance === 0){
            var selectedReaction = Math.floor(Math.random()*reactions.jojoReference.length);
            m.react(emoji[reactions.jojoReference[selectedReaction]]);
        }
        else if(chance === 4) m.reply('Yare, yaredaze...');
    },
    'big dumb': m=>rndAction(5,e=>m.react(emoji[e]),reactions.bigDumb),
    'sadness': m=>rndAction(5,e=>m.react(emoji[e]),reactions.sadness)
}

module.exports = responses;