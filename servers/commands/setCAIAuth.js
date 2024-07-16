const fs = require('fs');
const path = require('path');

module.exports = {
    name: "setCAIAuth",
    description: "Set The Character AI Auth Token",
    execute(message, args) {
        if (args.length === 0) {
            return message.reply('Please provide an auth token.');
        }

        const authToken = args[0];
        const envPath = path.resolve(__dirname, '../.env');

        console.log(`Received auth token: ${authToken}`);

        fs.readFile(envPath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading the .env file: ${err}`);
                return message.reply('Error reading the .env file.');
            }

            const lines = data.split('\n');
            let authTokenSet = false;

            const newLines = lines.map(line => {
                if (line.startsWith('CAI_AUTH_TOKEN=')) {
                    authTokenSet = true;
                    return `CAI_AUTH_TOKEN=${authToken}`;
                }
                return line;
            });

            if (!authTokenSet) {
                newLines.push(`CAI_AUTH_TOKEN=${authToken}`);
            }

            fs.writeFile(envPath, newLines.join('\n'), 'utf8', err => {
                if (err) {
                    console.error(`Error writing to the .env file: ${err}`);
                    return message.reply('Error writing to the .env file.');
                }

                console.log('Auth token set successfully.');
                message.reply('Auth token set successfully.');
            });
        });
    },
};
