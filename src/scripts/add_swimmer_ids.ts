import { SwimmerModel, SwimmerSchema } from "../models/SwimmerModel";
import * as mongoose from "mongoose";
const axios = require("axios");
const cheerio = require("cheerio");
require('dotenv').config();

let nicknames = {
    "Lilly King": {"firstName": "Lillia", "lastName": "King"},
    "Kasia Wasick": {"firstName": "Katarzyna", "lastName": "Wasick"},
    "Katie Ledecky": {"firstName": "Kathleen", "lastName": "Ledecky"},
    "Chad Le Clos": {"firstName": "Chad Guy Bertrand", "lastName": "Le Clos"},
    "Mykhailo Romanchuk": {"firstName": "Mykhaylo", "lastName": "Romanchuk"},
    "Sergey Shevtsov": {"firstName": "Sergii", "lastName": "Shevtsov"},
    "Sarah Sjostrom": {"firstName": "Sarah", "lastName": "Sjoestroem"},
    "Penny Oleksiak": {"firstName": "Penelope", "lastName": "Oleksiak"},
    "Imogen Clarke": {"firstName": "Imogen", "lastName": "Clark"},
    "Viktoriya Gunes": {"firstName": "Viktoria", "lastName": "Zeynep Gunes"},
    "Kristian Golomeev": {"firstName": "Kristian", "lastName": "Gkolomeev"},
    "Sarah Kohler": {"firstName": "Sarah", "lastName": "Koehler"},
    "Ali DeLoof": {"firstName": "Alexandra", "lastName": "Deloof"},
    "Gabby DeLoof": {"firstName": "Gabrielle", "lastName": "Deloof"},
    "Catie DeLoof": {"firstName": "Catherine", "lastName": "Deloof"},
    "Tom Shields": {"firstName": "Thomas", "lastName": "Shields"},
    "Annie Lazor": {"firstName": "Anne", "lastName": "Lazor"},
    "Ellan Eastin": {"firstName": "Ella", "lastName": "Eastin"},
    "Andi Murez": {"firstName": "Andrea", "lastName": "Murez"},
    "Jhennifer Alves da Conceicao": {"firstName": "Jhennifer", "lastName": "Conceicao"},
    "Anastasiya Gorbenko": {"firstName": "Anastasya", "lastName": "Gorbenko"},
    "Szabo Sebastian": {"firstName": "Szebasztian", "lastName": "Szabo"},
    "Ranomi Kromowidjodjo": {"firstName": "Ranomi", "lastName": "Kromowidjojo"},
    "Veronika Andrushenko": {"firstName": "Veronika", "lastName": "Andrusenko"},
    "Katalin Burian": {"firstName": "Kata", "lastName": "Burian"},
    "Siobhan-Marie O’Connor": {"firstName": "Siobhan-Marie", "lastName": "Oconnor"},
    "João de Lucca": {"firstName": "Joao", "lastName": "de Lucca"},
    "Milák Kristóf": {"firstName": "Milak", "lastName": "Kristof"},
    "Bohus Richárd": {"firstName": "Bohus", "lastName": "Richard"},
    "Késely Ajna": {"firstName": "Kesely", "lastName": "Ajna"},
    "Katinka Hosszú": {"firstName": "Katinka", "lastName": "Hosszu"},
    "Alba Vasquez": {"firstName": "Alba", "lastName": "Vasquez Ruiz"}
}

let people_ids = {
    "Andrew Wilson": 4952431,
    "Federica Pellegrini": 4046785,
    "Vlad Morozov": 4289626,
    "Mie Nielsen": 4135983,
    "Cody Miller": 4195668,
    "Sarah Gibson": 4812934,
    "Charlotte Bonnet": 4165495,
    "Larissa Oliveira": 5206851,
    "Alba Vasquez": 4614434,
    "Ilaria Bianchi": 4093728,
    "Michael Andrew": 4514190,
    "Marco Koch": 4091347,
    "Alys Thomas": 4211090,
    "Ryan Murphy": 4421104,
    "Kathleen Baker": 4653222,
    "Leah Smith": 4469403,
    "Alex Graham": 4342574,
    "Matt Wilson": 4839844,
    "Jess Hansen": 4342414
}

// Scrapes swimrankings.net to get the given athletes, swimranking ID
// Returns this ID
async function getID(first_name, last_name) {
    let full_name = first_name + " " + last_name;
    if (Object.keys(nicknames).includes(full_name)) {
        first_name = nicknames[full_name]["firstName"];
        last_name = nicknames[full_name]["lastName"];
    }
    let url = 'https://www.swimrankings.net/index.php';
    let params = {
        internalRequest: "athleteFind",
        athlete_club: -1,
        athlete_gender: -1,
        athlete_lastname: first_name,
        athlete_firstname: last_name
    };
    try {
        let res = await axios.get(url, {params});
        const html = cheerio.load(res.data);
        let href = html("a").attr("href");
        let id = href.slice(-7);
        if (Object.keys(people_ids).includes(full_name)) {
            id = people_ids[full_name];
        }
        return id;
    } catch {
        console.log("Swimmer Name: ", first_name, " ", last_name);
        console.log("Error");
    }
}

// Adds swimranking ID's to each swimmer in the database
// Allows for ease of time updating for when we add new swimmers into the system
async function addIds() {
    console.log("Started adding ids");
    let swimmers = await SwimmerModel.find({});
    for(let swimmer of swimmers) {
        let swimmer_id = await getID(swimmer.firstName, swimmer.lastName);
        await SwimmerModel.findOneAndUpdate({firstName: swimmer.firstName, lastName: swimmer.lastName}, {$set: {swimRankingId: swimmer_id}}, {new:true}, function(err, doc) {
            if (err) {
                console.error(err);
            }
        });
    }
    console.log("Done");
}


mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);


mongoose.connect(process.env.DBCONNECTION, {autoIndex: false}).then(() => {
  console.log("DB Connected");
//   addIds();
}).catch((error) => {
  console.error(error);
})