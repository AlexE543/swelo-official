import {SwimmerModel, SwimmerSchema} from "../models/SwimmerModel";
import {EventModel} from "../models/EventModel";
import * as mongoose from "mongoose";
import {type} from "os";
import {TopEventModel} from "../models/TopEventModel";

require('dotenv').config();

getTopThreeEvents();
let individual_event_list = ["50m Freestyle", "100m Freestyle", "200m Freestyle", "400m Freestyle", "50m Backstroke",
  "100m Backstroke", "200m Backstroke", "50m Breaststroke", "100m Breaststroke", "200m Breaststroke",
  "50m Butterfly", "100m Butterfly", "200m Butterfly", "200m Medley", "400m Medley"];


async function getTopThreeEvents() {

  let swimmers = await SwimmerModel.find({});
  for(let swimmer of swimmers) {
    let events = await EventModel.find({swimmerID: swimmer._id}).sort({score: -1}).limit(3);
    for(let event of events) {
      let obj = await TopEventModel.findOneAndUpdate({eventName: event.eventName}, {$push: {events: event}});
      console.log(obj);
    }
  }
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