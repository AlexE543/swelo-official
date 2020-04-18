import { SwimmerModel } from "../models/SwimmerModel";
import { EventModel } from "../models/EventModel";
import * as mongoose from "mongoose";
require('dotenv').config();

let individual_event_list = ["50m Freestyle", "100m Freestyle", "200m Freestyle", "400m Freestyle", "50m Backstroke",
  "100m Backstroke", "200m Backstroke", "50m Breaststroke", "100m Breaststroke", "200m Breaststroke",
  "50m Butterfly", "100m Butterfly", "200m Butterfly", "200m Medley", "400m Medley"];

// Sets all swimmers base elo at 550
async function addBaseElos() {
  console.log("Adding base elos...");
  await SwimmerModel.updateMany({}, {$set: {elo: 550}}, function(err, doc) {
    if (err) {
      console.error(err);
    }
  });
  console.log("Done adding base elos");
}

// Adds genders to all the events in the database
async function addGenders() {
  let swimmers = await SwimmerModel.find({});
  for (let swimmer of swimmers) {
    let gender = await swimmer.sex;
    for (let event_id of swimmer.events) {
      await EventModel.findByIdAndUpdate(event_id, {$set: {sex: gender}}, function(err, doc) {
        if (err) {
          console.log(err);
        }
        console.log(doc);
      })
    }
  }
}


// Gets all the swimmers top three events and returns a dictionary (eventName: [events]) and a list of the third ranked events for each swimmmer
async function getTopThreeEvents(individual_event_list, gender) {
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

// Calls addBaseElo to set the base elo at the base 550 value then updates it based off our algorithm
// Does this for every swimmer and every event of their top 3 for the given gender
async function updateBaseElos(gender) {
  console.log("Starting to update base elos...");
  let data = await getTopThreeEvents(individual_event_list, gender);
  let top_3 = data[0];
  let third_events = data[1];
  for(let event in top_3) {
    let i = 0;
    let length = Object.keys(top_3[event]).length;
    let sorted_events = await top_3[event].sort(function(a, b) {
      return b.score - a.score;
    });
    for(let e of sorted_events) {
      let update_amount = Math.round((length - 1 -i)*(200/(length - 1)));
      if(Object(third_events).indexOf(e) != -1) {
        update_amount *= .75;
      }
      i += 1;
      await SwimmerModel.findOneAndUpdate({_id: e.swimmerID}, {$inc: {elo: update_amount}});
    }
  }
  console.log("Finished updating base elos");
}

updateBaseElos("F") // Initial setup for large groups of swimmers (updated all swimmers in the database)
// addGenders();

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);


mongoose.connect(process.env.DBCONNECTION, {autoIndex: false}).then(() => {
  console.log("DB Connected");
}).catch((error) => {
  console.error(error);
})