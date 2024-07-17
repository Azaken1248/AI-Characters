module.exports = {
    name: 'ping',
    description: 'Ping!',
    execute(clientCAI,client,message, args) {
        message.channel.send('Pong.');
    },
};
