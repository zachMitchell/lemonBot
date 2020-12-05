//Simple code to determine if a message with a reply can't be sent back. taking out the id ommits the @mention math
module.exports = function (m,str,id){
    var finalSize = str.length + (id.length?id.length+5:0);
    var overflow = 2000 < finalSize;


    if(overflow)
        m.reply('Sorry, looks like the generated message went over 2000 characters ('+finalSize+') >.< Try again with a smaller message!');

    return overflow;
}