const CAINode = require('cainode')

const client = new CAINode();

async function debug(){
    const login = await client.login("AUTH_TOKEN");
    if(login){
        const acc = await client.user.info
        //const info = await client.character.info("5b0G10qbKz_echA7uD6WszQiPBuXiZywaiNuLefKEG4")  -> this is sengoku nadeko :D
        //const data = info["character"]["name"]
        const uname = acc["user"]["user"]["username"]
        console.log(uname)
    }
}

debug();