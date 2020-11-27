//Send a random rylan.png
var rylanList = [
    'https://imgur.com/n3EVBj6',
    'https://i.imgur.com/hMMCdLG.png',
    'https://i.imgur.com/nrcV3fH.png',
    'https://i.imgur.com/l4Sxb7q.png',
    'https://i.imgur.com/7lfRRVJ.jpg',
    'https://i.imgur.com/bLESwrD.png',
    'https://i.imgur.com/ytJhkdt.png',
];

var rylan = ()=>rylanList[Math.floor(Math.random()*rylanList.length)];

if(typeof module == 'object' && module.exports) module.exports = rylan;