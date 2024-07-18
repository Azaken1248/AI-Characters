const fs = require('fs');
const path = require('path');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    name: "getLogs",
    description: "Get Debug Logs Of The Bot",
    async execute(clientCAI, client, message, args) {
        try {
            const logFilePath = path.resolve(__dirname, '../storage/logs.txt');
            console.log("Resolved log file path:", logFilePath);

            if (fs.existsSync(logFilePath)) {
                console.log("Log file exists. Sending the file...");

                // Read the logs from the file
                const logs = fs.readFileSync(logFilePath, 'utf8');


                const attachment = new AttachmentBuilder(logFilePath);

                // Create an EmbedBuilder with the logs in a code block
                const embed = new EmbedBuilder()
                    .setColor('Yellow')
                    .setTitle('Debug Logs')
                    .setDescription('```' + logs.slice(-2048) + '```'); // Limit to 2048 characters due to Discord's embed limits

                // Send both embed and file
                await message.reply({ content: "Here are the debug logs:", embeds: [embed], files: [attachment] });
            } else {
                console.log("Log file does not exist.");
                message.reply("Log file not found.");
            }
        } catch (error) {
            console.error("Error sending log file:", error);
            message.channel.send("There was an error sending the log file.");
        }
    }
};
