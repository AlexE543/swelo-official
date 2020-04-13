import { SwimmerModel } from "../models/SwimmerModel";
import { EventModel } from "../models/EventModel";
import * as mongoose from "mongoose";
require('dotenv').config();
var swim_data = require('C:/Users/Alex Ellison/Desktop/Swelo-official/swelo-official/backup_LCM_data.json');

console.log("Started");


SwimmerModel.find({}, function(err, swimmers) {
    console.log(swimmers)
    swimmers.forEach(function(swimmer) {
        var events = EventModel.find({swimmerID: swimmer._id}).sort({score: -1}).limit(3);
        events.exec(function(err, res) {
            console.log(res);
        })
    });
});

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);


mongoose.connect(process.env.DBCONNECTION, {autoIndex: false}).then(() => {
    console.log("DB Connected");
}).catch((error) =>{
    console.error(error);
})