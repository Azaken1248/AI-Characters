import CAINode from "cainode";

const TOKEN = "YOUR_TOKEN";

const cainode = new CAINode();


async function login(token){
    console.log(token);
    const loginStatus = await cainode.login(token);
    {loginStatus?console.log('logged in!', loginStatus):console.log('failed to login!', loginStatus)};
}

async function create_character(token){
    console.log("Token: ", token);
    
}

login(TOKEN);

