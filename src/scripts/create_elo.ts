import {SwimmerModel} from "../models/SwimmerModel";
import {EventModel} from "../models/EventModel";
import * as mongoose from "mongoose";

require('dotenv').config();

let top_3_list = getTopThreeEvents();
console.log(top_3_list);
let individual_event_list = ["50m Freestyle", "100m Freestyle", "200m Freestyle", "400m Freestyle", "50m Backstroke",
  "100m Backstroke", "200m Backstroke", "50m Breaststroke", "100m Breaststroke", "200m Breaststroke",
  "50m Butterfly", "100m Butterfly", "200m Butterfly", "200m Medley", "400m Medley"];


async function getTopThreeEvents() {
  let top_3 = {}
  for(let e of individual_event_list) {
    top_3[e] = [];
  }
  let swimmers = await SwimmerModel.find({});
  for(let swimmer of swimmers) {
    let events = await EventModel.find({swimmerID: swimmer._id}).sort({score: -1}).limit(3);
    for(let event of events) {
      await top_3[event.eventName].push(event);
    }
  }
  return top_3;
}

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);


mongoose.connect(process.env.DBCONNECTION, {autoIndex: false}).then(() => {
  console.log("DB Connected");
}).catch((error) => {
  console.error(error);
})