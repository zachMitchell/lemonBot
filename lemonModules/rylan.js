//Send a random rylan.png
var rylanList = [
    'https://i.imgur.com/hZd5DaA.png',
    'https://i.imgur.com/hMMCdLG.png',
    'https://i.imgur.com/nrcV3fH.png',
    'https://i.imgur.com/l4Sxb7q.png',
    'https://i.imgur.com/7lfRRVJ.jpg',
    'https://i.imgur.com/bLESwrD.png',
    'https://i.imgur.com/ytJhkdt.png',
    'https://i.imgur.com/hZd5DaA.png',
    'https://imgur.com/n3EVBj6',
    'https://i.imgur.com/H9WRV01.png',
    'https://i.imgur.com/8hgewVn.png',
    'https://i.imgur.com/p56i6x2.png',
    'https://i.imgur.com/w5rcwqT.png',
    'https://i.imgur.com/Y5AT5Tg.png',
    'https://i.imgur.com/AtyftZP.png',
    'https://i.imgur.com/zIGqSXe.png'
];

var rylan = ()=>rylanList[Math.floor(Math.random()*rylanList.length)];

if(typeof module == 'object' && module.exports) module.exports = rylan;