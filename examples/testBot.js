const { Client, IntentsBitField } = require('discord.js');
const CAINode = require('cainode');

const clientCAI = new CAINode();

async function CAILogin(){
    try {
        const loginStatus = await clientCAI.login("613982af86531a899af63e7a9042576c3097816b");
        if(loginStatus){
            console.log("CAI Logged In!");
        } else {
            console.log("CAI Login Failed!");
        }
        return loginStatus;
    } catch (error) {
        console.error("CAI Login Error: ", error);
        return false;
    }
}

async function connectToCharacter(charid){
    try {
        const connectionStatus = await clientCAI.character.connect(charid);
        if(connectionStatus){
            console.log("Connected To Character");
        } else {
            console.log("Failed To Connect To Character!!");
        }
        return connectionStatus;
    } catch (error) {
        console.error("Connection Error: ", error);
        return false;
    }
}

async function setupChat(){
    await respond("", '*I invite nadeko to a discord server with a bunch of people she is on her phone looking at the server she waits for someone to message*');
}

async function respond(user, message){
    try {
        let send_message = await clientCAI.character.send_message(`${user}: ${message.trim()}`, true, "");
        let response = await clientCAI.character.generate_turn();
        if (send_message) {
            if (response && response.turn && response.turn.candidates && response.turn.candidates.length > 0) {
                const responseText = response.turn.candidates[0].raw_content;
                console.log(`Response: `, responseText);
                return responseText;
            } else {
                console.log("No response from character");
                return "No response from character";
            }
        } else {
            console.log("Message not sent!");
            return "Message not sent!";
        }
    } catch (error) {
        console.log("Message Error: ", error);
        return "Error responding to message";
    }
}

function filterMessage(message) {
    const regex = /(\*[^*]*\*)|([^*]+)/g;
    let matches = [];
    let match;
    
    while ((match = regex.exec(message)) !== null) {
        if (match[1] === undefined) {
            let cleanText = match[0].replace(/"/g, '');
            if (cleanText.trim()) {
                matches.push(cleanText.trim());
            }
        }
    }
    
    return matches.join(', ');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const clientDC = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

clientDC.login("MTI2MjM3MDg3NTUzMDAyMjkyMg.GfiUIi.MwDaPJGB9W9VW8DrQvg5PjXNChCVieFjHqaOoA");

clientDC.on('ready', async (c) => {
    console.log(`${c.user.tag} is online!`);
    const loginStatus = await CAILogin();
    if(loginStatus){
        await connectToCharacter("5b0G10qbKz_echA7uD6WszQiPBuXiZywaiNuLefKEG4");
        await setupChat();
    }
});

clientDC.on('messageCreate', async (msg) => {
    if (msg.author.bot) {
        return;
    }

    await msg.channel.sendTyping();
    
    const response = await respond(msg.author.displayName, msg.content);
    
    const filteredResponse = filterMessage(response);

    if (filteredResponse) {
        await msg.channel.send(filteredResponse);
    } else {
        console.log("Filtered response is empty, not sending to Discord.");
    }
});
