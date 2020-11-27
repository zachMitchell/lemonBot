//Made by Zachary Mitchell in 2020!
//The basic logic was copied/pasted in lemon.js for the longest time, it's probably time for a generalized module

module.exports = (chance,action,list = [])=>Math.floor(Math.random()*chance) === 0 ? action(list[Math.floor(Math.random()*list.length)]):0;