import { SwimmerModel } from "../models/SwimmerModel";
import * as mongoose from "mongoose";
require('dotenv').config();



async function getWinOdds(event) {
    let name_to_id = await getNicknameToId();
    let result = await getSortedEloList(event, name_to_id);
    let swimmer_elos = result["sorted_elos"];
    let elo_to_place = result["elo_to_place"];
    let sorted_prob_list = await calculateProbabilities(swimmer_elos);
    let prob_list = new Array(sorted_prob_list.length - 1).fill(0);
    for (let k=0;k<swimmer_elos.length;k++) {
        let pos = elo_to_place[swimmer_elos[k]];
        prob_list[pos-1] = sorted_prob_list[k]
    }
    // console.log("Event: ", event);
    // console.log("Probs: ", prob_list);
    let odds_list = await prob_to_odds(prob_list);
    // console.log("Odds: ", odds_list);
    return odds_list;
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

async function getSwimmerID(first_name, last_name, name_to_id) {
    let name = first_name.toLowerCase() + " " + last_name.toLowerCase();
    return name_to_id[name]
}

async function prob_to_odds(prob_list) {
    let odds_list = [];
    for (let prob of prob_list) {
        odds_list.push(1/prob);
    }
    return odds_list
}


// let e = [["Dressel Caeleb", 1], ["Shields Tom", 2], ["Switkowski Jan", 3], ["Conger Jack", 4], ["Le Clos Chad", 5], ["Lanza Vini", 6], ["Zirk Kregor", 7], ["Guy James", 8]]
// getWinOdds(e);

// mongoose.set('useNewUrlParser', true);
// mongoose.set('useFindAndModify', false);
// mongoose.set('useCreateIndex', true);
// mongoose.set('useUnifiedTopology', true);


// mongoose.connect(process.env.DBCONNECTION, {autoIndex: false}).then(() => {
//   console.log("DB Connected");
// }).catch((error) => {
//   console.error(error);
// })

export default getWinOdds;