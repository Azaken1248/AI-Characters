
module.exports = {
    name: "getChannelID",
    description: "Add AI Character To Server",
    execute(clientCAI,client,message,args){
        console.log(message.channelId);
        message.reply(message.channelId);
    }
}