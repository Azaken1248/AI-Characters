const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
    name: "getLogs",
    description: "Get Debug Logs Of The Bot",
    async execute(clientCAI, client, message, args) {
        try {
            const logFilePath = path.resolve(__dirname, '../storage/logs.txt');
            console.log("Resolved log file path:", logFilePath);

            if (fs.existsSync(logFilePath)) {
                console.log("Log file exists. Sending the file...");
                const attachment = new AttachmentBuilder(logFilePath);
                await message.reply({ content: "Debug Logs", files: [attachment] });
            } else {
                console.log("Log file does not exist.");
                message.channel.send("Log file not found.");
            }
        } catch (error) {
            console.error("Error sending log file:", error);
            message.channel.send("There was an error sending the log file.");
        }
    }
}
