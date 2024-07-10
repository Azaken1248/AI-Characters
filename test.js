const CAINode = require("cainode");
const readline = require("readline");

const client = new CAINode();

async function start() {
  const token = "YOUR_AUTH_TOKEN";  
  const login = await client.login(token);

  if (!login) {
    throw "failed client login!";
  }

  console.log("Client login:", login);

  const con = await client.character.connect("YOUR_CHARACTER_ID");

  if (con) {
    console.log("Connected to character");
    const info = await client.character.info("YOUR_CHARACTER_ID");
    console.log(info);
  } else {
    console.log("Connection failed");
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.setPrompt("> ");
  rl.prompt();

  rl.on("line", async (line) => {
    let send_message = await client.character.send_message(line.trim(), true, "");
    let response = await client.character.generate_turn();

    if(send_message){

        if (response && response.turn && response.turn.candidates && response.turn.candidates.length > 0) {
            console.log("Nadeko: ", response.turn.candidates[0].raw_content);
        } else {
            console.log("No response from character");
        }
    }else{
        console.log("Message not sent!")
    }

    rl.prompt();
  }).on("close", () => {
    console.log("Chat ended");
    process.exit(0);
  });
}

start();
