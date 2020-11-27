//Simple shuffling pattern. Note this list isn't copied but rearranged, so your original array will be affected.
var shuffle = (list = [])=>list.sort((e,f)=>(Math.floor(Math.random()*2) ? 1:-1));

if(typeof module == 'object' && module.exports) module.exports = shuffle;