// const express = require('express');
// const cors = require('cors');
// const fs = require('fs').promises;
// const bodyParser = require('body-parser');
// const CAINode = require('cainode');


// const app = express();
// const client = new CAINode();
// const port = 5132;

// app.use(cors());
// app.use(bodyParser.json());

// function getMinAndMaxScores(characters) {
//     let minScore = Infinity;
//     let maxScore = -Infinity;

//     characters.forEach(character => {
//         const score = parseFloat(character["search_score"]);
//         if (score < minScore) {
//             minScore = score;
//         }
//         if (score > maxScore) {
//             maxScore = score;
//         }
//     });

//     return [minScore, maxScore];
// }

// function normalizeScores(min, max, score) {
//     const normalizedScore = ((score - min) / (max - min)) * 100;
//     return parseFloat(normalizedScore.toFixed(2));
// }

// async function login(token) {
//     try {
//         const login = await client.login(token);
//         return login ? true : false;
//     } catch (error) {
//         console.error('Login error:', error);
//         return false;
//     }
// }

// async function search(keyword) {
//     try {
//         const searchResults = await client.character.search(keyword);
//         return normalizeSearch(searchResults);
//     } catch (error) {
//         console.error('Search error:', error);
//         return {};
//     }
// }

// function normalizeSearch(rawResults) {
//     const normalizedSearch = {};
//     const filteredArr = [];

//     const charList = Array.from(rawResults["characters"]);
//     const [minScore, maxScore] = getMinAndMaxScores(charList);

//     charList.forEach(character => {
//         const filteredCharacter = {};

//         const charName = character["participant__name"];
//         const imgSrc = "https://characterai.io/i/80/static/avatars/" + character["avatar_file_name"];
//         const character_id = character["external_id"];
//         const search_score = character["search_score"];
//         const popularity = normalizeScores(minScore, maxScore, search_score);

//         filteredCharacter["name"] = charName;
//         filteredCharacter["pfp"] = imgSrc;
//         filteredCharacter["id"] = character_id;
//         filteredCharacter["popularity"] = popularity;

//         filteredArr.push(filteredCharacter);
//     });

//     normalizedSearch["characters"] = filteredArr;
//     return normalizedSearch;
// }

// app.post('/receive_token', async (req, res) => {
//     const { token } = req.body;
//     console.log('Received token:', token);

//     if (token) {
//         try {
//             await fs.writeFile('token.txt', token);
//             console.log("Written Successfully");
//             res.json({ status: 'success', tokenReceived: token });
//         } catch (err) {
//             console.log("Error Writing JSON:", err);
//             res.json({ status: 'writeError' });
//         }
//     } else {
//         res.json({ status: 'tokenError' });
//     }
// });

// app.post('/get_search', async (req, res) => {
//     const { searchKey } = req.body;
//     let queryResults = {};

//     console.log("Search Term:", searchKey);

//     try {
//         const token = await fs.readFile('token.txt', 'utf-8');
//         const loginStatus = await login(token);

//         if (!loginStatus) {
//             return res.json({ status: 'loginError' });
//         }

//         console.log("Logged in");

//         if (searchKey) {
//             queryResults = await search(searchKey);
//         } else {
//             return res.json({ status: 'searchError' });
//         }

//         res.json(queryResults);
//     } catch (err) {
//         console.error("Error reading file or during search:", err);
//         res.json({ status: 'searchError' });
//     }
// });

// app.listen(port, () => {
//     console.log(`Express server running on http://localhost:${port}`);
// });

const CAINode = require('cainode');

async function getCharacterDetails(characterID) {
  const node = new CAINode();

  try {
    await node.login("613982af86531a899af63e7a9042576c3097816b");
    const characterDetails = await node.character.info(characterID);
    const character = node.character.connect(characterID)

    //console.log(characterDetails)

    const name = characterDetails.character?.name ?? 'Unknown Name';
    const description = characterDetails.character?.description ?? 'No description';
    const avatarFileName = characterDetails.character?.avatar_file_name;
    const avatarURL = avatarFileName
      ? `https://characterai.io/i/80/static/avatars/${avatarFileName}`
      : 'No avatar';
    const caiLink = `https://character.ai/chat/${characterDetails.character.external_id}`;

    //console.log('Name:', name);
    //console.log('Description:', description);
    //console.log('Avatar:', avatarURL);
    //console.log('Chat Link:', caiLink);

    const conv = await client.character.create_new_conversation();
    console.log(conv)

  } catch (err) {
    console.error('Error fetching character details:', err.message);
  }
}

// Example usage
getCharacterDetails('nE7EhM4xvVcUHrnks2IZ6ihcdWG2bPP_PM7WnHJQEZM');
