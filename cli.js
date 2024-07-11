const CAINode = require("cainode");
const readline = require("readline");

const client = new CAINode();

async function start() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question("Enter your token: ", async (token) => {
    const login = await client.login(token.trim());

    if (!login) {
      console.log("Failed client login!");
      rl.close();
      return;
    }

    console.log("Client login successful!");

    rl.question("Enter your character ID: ", async (characterId) => {
      const con = await client.character.connect(characterId.trim());

      if (con) {
        console.log("Connected to character");
        const characterInfo = await client.character.info(characterId.trim());
        const userInfo = client.user.info;
        const characterName = characterInfo["character"]["name"];
        const username = userInfo["user"]["user"]["username"];

        rl.setPrompt( `${username}: `);
        rl.prompt();

        rl.on("line", async (line) => {
          let send_message = await client.character.send_message(line.trim(), true, "");
          let response = await client.character.generate_turn();

          if (send_message) {
            if (response && response.turn && response.turn.candidates && response.turn.candidates.length > 0) {
              console.log(`${characterName} : `, response.turn.candidates[0].raw_content);
            } else {
              console.log("No response from character");
            }
          } else {
            console.log("Message not sent!");
          }

          rl.prompt();
        }).on("close", () => {
          console.log("Chat ended");
          process.exit(0);
        });
      } else {
        console.log("Connection failed");
        rl.close();
      }
    });
  });
}

start();
