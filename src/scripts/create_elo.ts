import { SwimmerModel } from "../models/SwimmerModel";
import { EventModel } from "../models/EventModel";
import * as mongoose from "mongoose";

require('dotenv').config();

let individual_event_list = ["50m Freestyle", "100m Freestyle", "200m Freestyle", "400m Freestyle", "50m Backstroke",
  "100m Backstroke", "200m Backstroke", "50m Breaststroke", "100m Breaststroke", "200m Breaststroke",
  "50m Butterfly", "100m Butterfly", "200m Butterfly", "200m Medley", "400m Medley"];

// Sets all swimmers base elo at 550
async function addBaseElos() {
  await SwimmerModel.updateMany({}, {$set: {elo: 550}});
}

// Gets all the swimmers top three events and returns a dictionary (eventName: [events]) and a list of the third ranked events for each swimmmer
async function getTopThreeEvents(individual_event_list) {
  let top_3 = {};
  let third_events = [];
  for(let e of individual_event_list) {
    top_3[e] = [];
  }
  let swimmers = await SwimmerModel.find({});
  for(let swimmer of swimmers) {
    let events = await EventModel.find({swimmerID: swimmer._id}).sort({score: -1}).limit(3);
    for(let event of events) {
      await top_3[event.eventName].push(event);
      if(events.indexOf(event)==2) {
        third_events.push(event);
      }
    }
  }
  return [top_3, third_events]
}

// Calls addBaseElo to set the base elo at the base 550 value then updates it based off our algorithm
// Does this for every swimmer and every event of their top 3
async function updateBaseElos() {
  await addBaseElos()
  let top_3 = await getTopThreeEvents(individual_event_list)[0];
  let third_events = await getTopThreeEvents(individual_event_list)[1];
  
  for(let event of Object.keys(top_3)) {
    for(let i=0;i<top_3[event].length;i++) {
      let update_amount = (length - 1 -i)*(200/top_3[event].length - 1);
      if(third_events.indexOf(top_3[event][i]) != -1) {
        update_amount *= .75;
      }
      await SwimmerModel.findOneAndUpdate({_id: top_3[event][i].swimmerID}, {$inc: {elo: update_amount}});
    }
  }

}

updateBaseElos() // Initial setup for large groups of swimmers (updated all swimmers in the database)


mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);


mongoose.connect(process.env.DBCONNECTION, {autoIndex: false}).then(() => {
  console.log("DB Connected");
}).catch((error) => {
  console.error(error);
})