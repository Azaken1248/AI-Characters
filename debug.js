const CAINode = require('cainode')
const fs = require('fs')

const client = new CAINode();

function getMinAndMaxScores(characters) {
    let minScore = Infinity;
    let maxScore = -Infinity;

    characters.forEach(character => {
        const score = parseFloat(character["search_score"]);
        if (score < minScore) {
            minScore = score;
        }
        if (score > maxScore) {
            maxScore = score;
        }
        
        console.log("("+minScore+","+maxScore+")")
    });
    
     console.log("Final: ("+minScore+","+maxScore+")")

    return [minScore, maxScore];
}


async function debug(){
    const login = await client.login("613982af86531a899af63e7a9042576c3097816b");
    if(login){
        //const info = await client.character.info("5b0G10qbKz_echA7uD6WszQiPBuXiZywaiNuLefKEG4")  -> this is sengoku nadeko :D
        //const data = info["character"]["name"]
        const searchResults = await client.character.search("Sengoku Nadeko")
        
        fs.writeFile('data.json',JSON.stringify(searchResults),(err) => {
            if(err){
                console.log("Error Writing JSON!!")
            }else{
                console.log("Written Successfully")
            }
        })
        //const uname = acc["user"]["user"]["username"]
        const resArr = Array.from(searchResults["characters"])

        const minmax = getMinAndMaxScores(resArr)
        const minSearch = minmax[0]
        const maxSearch = minmax[1]

        const temp = []
        resArr.forEach(character => {
            const filtered = {}
            const charName = character["participant__name"]
            const imgSrc = "https://characterai.io/i/80/static/avatars/" + character["avatar_file_name"]
            const character_id = character["external_id"]
            const search_score = character["search_score"]

            const populatiry = ((search_score-minSearch)/(maxSearch-minSearch))*100

            filtered["name"] = charName
            filtered["pfp"] = imgSrc
            filtered["id"] = character_id
            filtered["popularity"] = parseFloat(populatiry.toFixed(2))

            temp.push(filtered)
        })

        console.log(temp)
    }
}

debug();