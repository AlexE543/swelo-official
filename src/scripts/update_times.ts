const axios = require("axios");
const cheerio = require("cheerio");
const cheerioTableparser = require('cheerio-tableparser');
require('dotenv').config();
import { SwimmerModel, SwimmerSchema } from "../models/SwimmerModel";
import * as mongoose from "mongoose";
import { EventModel } from "../models/EventModel";


// Scrapes swimrankings.net website for the given swimmer to update their times, scores, etc.
async function getTimes(swimmer_id) {
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
                time_data[events[i]]["score"] = scores[i];
                time_data[events[i]]["swimmerId"] = swimmer_id;
            }
        }
        return time_data
    } catch (err){
        console.log("Error: ", err);
    }
}

async function getAllTimes() {
    console.log("Started Updating Times...");
    let swimmers = await SwimmerModel.find({});
    for (let s of swimmers) {
        console.log(s.firstName);
        let swimmer_id = s._id;
        let swimmer_info = await getTimes(s["swimRankingId"]);
        console.log(swimmer_info != {});
        for (let event in swimmer_info) {
            let new_time = swimmer_info[event]["time"];
            let new_score = swimmer_info[event]["score"];
            await EventModel.findOneAndUpdate({swimmerID: swimmer_id, eventName: event}, {$set: {time: new_time, score: new_score}}, function(err, doc) {
                if (err) {
                    console.error(err);
                }
            });
        }
    }
    console.log("Done Updating Times");
}
getAllTimes();

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);


mongoose.connect(process.env.DBCONNECTION, {autoIndex: false}).then(() => {
  console.log("DB Connected");
}).catch((error) => {
  console.error(error);
})