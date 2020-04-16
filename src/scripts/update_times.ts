const axios = require("axios");
const cheerio = require("cheerio");
const cheerioTableparser = require('cheerio-tableparser');


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
    // TODO: implement this to get the times for all swimmers
}
let time_data = getTimes(4772537).then(function(obj) {
    console.log(obj);
});