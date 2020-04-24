import { SwimmerModel } from "../models/SwimmerModel";
import { EventModel } from "../models/EventModel";
import * as mongoose from "mongoose";
require('dotenv').config();


async function addNickname(first_name, last_name, nickname) {
    await SwimmerModel.findOneAndUpdate({firstName: first_name, lastName: last_name}, {$push: {nicknames: nickname}}, function(err, res) {
        if (err) {
            console.log(err);
        }
        console.log(res);
    })
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