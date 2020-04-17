import { SwimmerModel, SwimmerSchema } from "../models/SwimmerModel";
import * as mongoose from "mongoose";
const axios = require("axios");
const cheerio = require("cheerio");
require('dotenv').config();


// Scrapes swimrankings.net to get the given athletes, swimranking ID
// Returns this ID
async function getID(first_name, last_name) {
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
        console.log(id);
        return id;
    } catch {
        console.log("Error");
    }
}

// Adds swimranking ID's to each swimmer in the database
// Allows for ease of time updating for when we add new swimmers into the system
async function addIds() {
    let swimmers = await SwimmerModel.find({});
    console.log(swimmers);
    // for(let swimmer of swimmers) {
    //     let swimmer_id = await getID(swimmer.firstName, swimmer.lastName);
    //     await SwimmerModel.findOneAndUpdate({firstName: swimmer.firstName, lastName: swimmer.lastName}, {$set: {swimRankingsId: swimmer_id}});
    // }
}


mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);


mongoose.connect(process.env.DBCONNECTION, {autoIndex: false}).then(() => {
  console.log("DB Connected");
  addIds();
}).catch((error) => {
  console.error(error);
})