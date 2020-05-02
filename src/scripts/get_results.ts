import { SwimmerModel } from "../models/SwimmerModel";
import * as mongoose from "mongoose";
require('dotenv').config();

var path = require('path');
let results_pages = ['isl_vegas_day_1_results.pdf', 'las-vegas-day-2-isl-results.pdf', 'isl_london_day_1_results.pdf', 'isl_london_day_2_results.pdf', 
                    'isl_results_budapest_day_1-1.pdf', 'isl_results_budapest_sunday.pdf', 'dallas_lewisville_isl_results_day_1.pdf',
                    'isl_results_dallas_day_2.pdf', '13_11_naples-results-day-1_final.-pdf-1.pdf', 'naples_results_day_2.pdf',
                    'isl_results_washington_college_park_day_1.pdf', 'isl_college_park_results_day_2.pdf'];

 
// var filePath = path.join('./results/isl_vegas_day_1_results.pdf');
var filePath = path.join('./results/las-vegas-day-2-isl-results.pdf');

// Order: getResults => addToList => updateElos => getUpdate => getSwimmerElos()
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
            if (item.text != "Name" && (item.x == 5.737 || item.x == 7.346)) {
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

async function updateElos(names, ranks) {
    let name_to_id = await getNicknameToId();
    let event = [];
    for (let i = 0; i < names.length; i++) {
        if (i > 1 && ranks[i] == 1) {
            await getWinProbabilities(event, name_to_id);
            event = []
        }
        event.push([names[i], ranks[i]]);
    }
    await getWinProbabilities(event, name_to_id);
}

// Fixes errors with the names being formatted different
async function getSwimmerID(first_name, last_name, name_to_id) {
    let name = first_name.toLowerCase() + " " + last_name.toLowerCase();
    return name_to_id[name]
}


async function getSortedEloList(event, name_to_id) {
    let elo_list = [];
    let elo_to_place = {};
    for (let athlete of event) {
        let athlete_name = athlete[0].split(" ");
        let half = Math.ceil(athlete_name.length/2);
        let id = await getSwimmerID(athlete_name.slice(half, athlete_name.length).join(" "), athlete_name.slice(0, half).join(" "), name_to_id);
        let swimmer = await SwimmerModel.findById(id);
        if (swimmer == null) {
            console.log(athlete_name);
            console.log("DNE");
        } else {
            elo_list.push(swimmer.elo);
            elo_to_place[swimmer.elo] = athlete[1];
        }
    }
    let result = {}
    result["unsorted_elos"] = elo_list;
    let sorted_elos = [...elo_list];
    sorted_elos.sort(function(a, b){return b-a});
    result["sorted_elos"] = sorted_elos;
    result["elo_to_place"] = elo_to_place;
    return result;
}

async function getWinProbabilities(event, name_to_id) {
    console.log("Event: ", event);
    let result = await getSortedEloList(event, name_to_id);
    let swimmer_elos = result["sorted_elos"];
    let elo_to_place = result["elo_to_place"];
    let old_elos = result["unsorted_elos"];
    let sorted_prob_list = await calculateProbabilities(swimmer_elos);
    let prob_list = new Array(sorted_prob_list.length - 1).fill(0);
    for (let k=0;k<swimmer_elos.length;k++) {
        let pos = elo_to_place[swimmer_elos[k]];
        prob_list[pos-1] = sorted_prob_list[k]
    }
    let updated_elos = await probToElo(old_elos, prob_list, old_elos.length);
    for (let i = 0;i < swimmer_elos.length; i++) {
        let athlete_name = event[i][0].split(" ");
        let half = Math.ceil(athlete_name.length/2);
        let id = await getSwimmerID(athlete_name.slice(half, athlete_name.length).join(" "), athlete_name.slice(0, half).join(" "), name_to_id);
        let update_amount = updated_elos[i] - old_elos[i];
        // console.log("Updated Elo: ", updated_elos[i], "Old Elo: ", old_elos[i]);
        // console.log("Update Amount: ", update_amount);
        await SwimmerModel.findByIdAndUpdate(id, {$inc: {elo: update_amount}});
    }
    console.log("Old Elos: ", old_elos);
    console.log("Updated Elos: ", updated_elos);
    // console.log("Odds: ", prob_list);
    return;
}

async function calculateProbabilities(swimmer_elos) {
    let probability_list = [];
    let num_swimmers = swimmer_elos.length;
    for (let i = 0; i < num_swimmers;i++) {
        let curr_elo = swimmer_elos[i];
        let tot = 1;
        for (let j = 0; j < num_swimmers; j++) {
            if (i != j) {
                let aux_prob = 1/(1 + 10**((swimmer_elos[j] - curr_elo)/400))
                tot *= aux_prob;
            }
        }
        probability_list.push((num_swimmers - 1) * tot);
    }
    return probability_list;
}

async function probToElo(swimmer_elos, probability_list, num_swimmers) {
    let k = 20/num_swimmers;
    let updated_elos = [];
    for (let i = 0; i<num_swimmers; i++) {
        let num_lost_to = 0;
        for (let j = 0; j < num_swimmers; j++) {
            if (j<i) {
                num_lost_to += 1;
            }
        }
        let update = swimmer_elos[i] + ((num_swimmers - 1 - num_lost_to)*(k)*(1 - probability_list[i])) +((num_lost_to)*(k)*(0 - probability_list[i]))
        updated_elos.push(update);
    }
    return updated_elos;
}

async function elo_to_odds(prob_list) {
    let odds_list = [];
    for (let prob of prob_list) {
        odds_list.push(1/prob);
    }
    return odds_list
}

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);


mongoose.connect(process.env.DBCONNECTION, {autoIndex: false}).then(() => {
  console.log("DB Connected");
  getResults();
}).catch((error) => {
  console.error(error);
})