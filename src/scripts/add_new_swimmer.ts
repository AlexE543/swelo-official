const axios = require("axios");
const cheerio = require("cheerio");
const cheerioTableparser = require('cheerio-tableparser');
require('dotenv').config();
import { SwimmerModel, SwimmerSchema } from "../models/SwimmerModel";
import * as mongoose from "mongoose";
import { EventModel } from "../models/EventModel";

// Gets the swimmer id from swimrankings.net and returns it
async function getSwimmerID(first_name, last_name) {
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
        return id;
    } catch {
        console.log("Swimmer Name: ", first_name, " ", last_name);
        console.log("Error, please manually find swimmer ID");
        return null;
    }
}

// gets the times, scores, etc. from swimranking.net and returns them
async function getSwimmmerTimes(swimmer_id) {
    let url = 'https://www.swimrankings.net/index.php?';
    let params = {
        page: "athleteDetail",
        athleteId: swimmer_id
    }
    try {
        let res = await axios.get("https://www.swimrankings.net/index.php?", {params});
        const $ = await cheerio.load(res.data);
        await cheerioTableparser($);
        let table = await $('table.athleteBest', 'div#content').parsetable(true, true, true);
        let events = table[0];
        let courses = table[1];
        let times = table[2];
        let scores = table[3];
        let time_data = {};
        for(let i = 1; i<courses.length;i++) {
            if(courses[i] == '50m') {
                if(scores[i] == '-') {
                    scores[i] = 0;
                }
                time_data[events[i]] = {}
                time_data[events[i]]["time"] = times[i];
                time_data[events[i]]["course"] = courses[i];
                time_data[events[i]]["score"] = Number(scores[i]);
                time_data[events[i]]["swimmerId"] = String(swimmer_id);
            }
        }
        return time_data
    } catch (err){
        console.log("Error: ", err);
    }
}

// Adds swimmers events to the events DB
async function addEvents(data, mongo_id, gender) {
    for (let event in data) {
        let event_to_add = {
            eventName: event,
            time: data[event]["time"],
            score: data[event]["score"],
            course: data[event]["course"],
            sex: gender,
            swimmerID: mongo_id
        }
        await EventModel.create(event_to_add);
    }
    return;
}

// Add a swimmer to the system
export async function addSwimmer(first_name, last_name, gender=null, team=null) {
    console.log("Adding Swimmer...");
    let swimRanking = await getSwimmerID(first_name, last_name); // Get swim ranking id
    if (swimRanking == null) {
        return;
    }
    else {
        let swimmer = {         // Build the Swimmer with the info we have
            firstName: first_name,
            lastName: last_name,
            sex: gender,
            team: team,
            swimRankingId: swimRanking,
            elo: 550,
            events: [],
            nicknames: []
        };
        await SwimmerModel.create(swimmer); // Add the swimmer to the database
        let s = await SwimmerModel.find({firstName: first_name, lastName: last_name}); // Find that same swimmer so we can get its id
        let id = s[0]._id;
        let data = await getSwimmmerTimes(swimRanking);
        // Add Events to the database
        await addEvents(data, id, gender);
        let events_to_add = await EventModel.find({swimmerID: id});
        await SwimmerModel.findByIdAndUpdate(id, {$set: {events: events_to_add}}, {upsert: false}, function(err, doc) {
            if (err) {
                console.error(err);
            }
        });
        console.log("About to update Elo");
        await updateElo(id, gender);
        console.log("Added Swimmer!");
    }
}

let individual_event_list = ["50m Freestyle", "100m Freestyle", "200m Freestyle", "400m Freestyle", "50m Backstroke",
  "100m Backstroke", "200m Backstroke", "50m Breaststroke", "100m Breaststroke", "200m Breaststroke",
  "50m Butterfly", "100m Butterfly", "200m Butterfly", "200m Medley", "400m Medley"];


// Gets all the swimmers of the given gender's top three events and returns them
async function getTopThreeEvents(gender) {
    console.log("Getting top 3 events");
    let top_3 = {};
    let third_events = [];
    for(let e of individual_event_list) {
      top_3[e] = [];
    }
    let swimmers = await SwimmerModel.find({});
    for(let swimmer of swimmers) {
      let events = await EventModel.find({swimmerID: swimmer._id, sex: gender}).sort({score: -1});
      let num_added = 0;
      for(let event of events) {
        if (individual_event_list.includes(event.eventName)) {
          await top_3[event.eventName].push(event);
          num_added += 1;
          if (num_added == 3) {
            third_events.push(event);
            break;
          }
        }
      }
    }
    console.log("Done getting top 3 event info");
    return [top_3, third_events]
}

// Caclulates elo for the new swimmer and adds it in
async function updateElo(swimmer_id, gender) {
    console.log("Starting elo update");
    let swimmers_events = await EventModel.find({swimmerID: swimmer_id}).sort({score: -1});
    let events_to_get = [];
    let num_added = 0;
    for (let event of swimmers_events) {
        if (individual_event_list.includes(event.eventName)) {
            events_to_get.push(event.eventName);
            num_added += 1;
            if (num_added == 3) {
                break;
            }
        }
    }
    let data = await getTopThreeEvents(gender);
    let top_3 = data[0];
    let third_events = data[1];
    for (let e of events_to_get) {
        let i = 0;
        let length = await Object.keys(top_3[e]).length;
        let sorted_events = top_3[e].sort(function(a, b) {
            return b.score - a.score;
        });
        for await (let se of sorted_events) {
            let current_id = await se.swimmerID;
            if (String(current_id) == String(swimmer_id)) {
                let update_amount = Math.round((length - 1 -i)*(200/(length - 1)));
                if (Object(third_events).indexOf(se) != -1) {
                    update_amount *= .75;
                }
                await SwimmerModel.findByIdAndUpdate(swimmer_id, {$inc: {elo: update_amount}});
            }
            i += 1;
        }
    }
    console.log("Finished updating base elo");
  }


// updateElo("5e9a725c76c4542524c2e3fd", "M");
// addSwimmer("Jocelyn", "Ulyett", "F", "Energy Standard");
// addSwimmer("Bailey", "Andison", "F", "LA Current");
addSwimmer("Caeleb", "Dressel", "M", "Cali Condors");


mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);


mongoose.connect(process.env.DBCONNECTION, {autoIndex: false}).then(() => {
  console.log("DB Connected");
}).catch((error) => {
  console.error(error);
})