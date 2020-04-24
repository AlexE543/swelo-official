import { SwimmerModel } from "../models/SwimmerModel";
import { EventModel } from "../models/EventModel";
import * as mongoose from "mongoose";
require('dotenv').config();

var path = require('path');
var filePath = path.join('./isl_vegas_day_1_results.pdf');
// var filePath = path.join('./las-vegas-day-2-isl-results.pdf');


// Hard approach of parsing the pdf
var pdfreader = require("pdfreader");

let names = [];
let ranks = [];
// Adds data from the pdf parse to a names and ranks list
async function addToList(data_type, data, counter) {
    if (data_type == "name") {
        names.push(data);
        ranks.push(counter);
        return data
    }
    if (data_type == "done") {
        updateElos(names, ranks);
    }
}

async function getNicknameToId() {
    let nick_to_id = {}
    let swimmers = await SwimmerModel.find({});
    for (let s of swimmers) {
        let name = s.firstName + " " + s.lastName;
        let id = s._id;
        nick_to_id[name.toLowerCase()] = id;
        for (let n of s.nicknames) {
            nick_to_id[n.toLowerCase()] = id;
        }
    }
    return nick_to_id
}

// Parses the pdf to pull name and ranking results
async function getResults() {
    async function stream() {
        let counter = 1;
        let count_max = 9;
        let previous_event = "";
        await new pdfreader.PdfReader().parseFileItems(filePath, function(err, item) {
            if (err) {
                console.error(err);
            }
            else if (!item) {
                addToList("done", "test", counter);
            }
            else if (item.text) {
                if (item.text == "Men's 50m Freestyle Skin Race" || item.text == "Women's 50m Freestyle Skin Race") {
                    previous_event = item.text;
                }

                if (item.text == "Round 1") {
                    count_max = 9;
                } else if (item.text == "Round 2") {
                    count_max = 5;
                } else if (item.text == "Final" && (previous_event == "Men's 50m Freestyle Skin Race" || previous_event == "Women's 50m Freestyle Skin Race")) {
                    count_max = 3;
                }
                if (item.text != "Name" && (item.x == 5.737 || item.x == 7.346 || item.x == 5.415)) {
                    addToList("name", item.text, counter);
                    counter += 1;
                    if (counter == count_max) {
                        counter = 1;
                        if (count_max == 3) {
                            count_max = 9;
                        }
                    }
                }
            }
        });
    }
    stream();
}


async function updateElos(names, ranks) {
    let name_to_id = await getNicknameToId();
    let event = [];
    for (let i = 0; i < names.length; i++) {
        if (i > 1 && ranks[i] == 1) {
            await getUpdate(event, name_to_id);
            event = []
        }
        event.push([names[i], ranks[i]]);
    }
    await getUpdate(event, name_to_id);
}

// Fixes errors with the names being formatted different
async function preventNameErrors(first_name, last_name, name_to_id) {
    let name = first_name.toLowerCase() + " " + last_name.toLowerCase();
    return name_to_id[name]
}

// Gets the swimmers elos for each swimmer in the event
async function getSwimmerElos(swimmers, name_to_id) {
    for (let athlete of swimmers) {
        let athlete_name = athlete[0].split(" ");
        let half = Math.ceil(athlete_name.length/2);
        let id = await preventNameErrors(athlete_name.slice(half, athlete_name.length).join(" "), athlete_name.slice(0, half).join(" "), name_to_id);
        let swimmer = await SwimmerModel.findById(id);
        if (swimmer == null) {
            console.log(athlete_name);
            console.log("DNE");
        } else {
            // console.log(swimmer.elo);
        }
    }
    return []
}

async function getUpdate(event, name_to_id) {
    let elo_list = []
    let swimmer_elos = await getSwimmerElos(event, name_to_id);
    for (let i = 0; i < swimmer_elos.length;i++) {
        let matchup_elos = [];
        for (let j = 0; j < swimmer_elos.length;j++) {
            matchup_elos.push(swimmer_elos[j]);
        }
        matchup_elos.splice(i, 1);
        elo_list.push(matchup_elos);
    }

    return;
}
getResults();

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);


mongoose.connect(process.env.DBCONNECTION, {autoIndex: false}).then(() => {
  console.log("DB Connected");
}).catch((error) => {
  console.error(error);
})