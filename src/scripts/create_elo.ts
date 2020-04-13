import { SwimmerModel, SwimmerSchema } from "../models/SwimmerModel";
import { EventModel } from "../models/EventModel";
import * as mongoose from "mongoose";
import { type } from "os";
import { TopEventModel } from "../models/TopEventModel";
require('dotenv').config();
let swim_data = require('C:/Users/Alex Ellison/Desktop/Swelo-official/swelo-official/backup_LCM_data.json');
// function createEventLeaderboard(event_list) {
//     let event_leaderboard = {
//         "M": {},
//         "F": {}
//     };
//     event_list.forEach(function(event) {
//         event_leaderboard["M"][event] = [];
//         event_leaderboard["F"][event] = [];
//     });
    
//     SwimmerModel.find({}, function(err, swimmers) {
//         swimmers.forEach(function(swimmer) {
//             let events = EventModel.find({swimmerID: swimmer._id}).sort({score: -1}).limit(3);
//             events.exec(function(err, res) {
//                 if (err) {
//                     console.log(err);
//                 }
//                 res.forEach(function(event){
//                     let event_name = event.eventName.toString()
//                     if (event_list.includes(event_name)) {
//                         event_leaderboard[swimmer.sex][event_name].push(event);
//                     }
//                 })
//             })
//         });
//     });
//     return event_leaderboard;
// }

// function createElos(event_leaderboard, individual_event_list) {
//     let elos = {
//         "M": {},
//         "F": {}
//     }

//     SwimmerModel.find({}, function(err, swimmers) {
//         swimmers.forEach(function(swimmer) {
//             elos[swimmer.sex][swimmer._id] = 550;
//         })
//     });
//     individual_event_list.forEach(function(event) {
//         event_leaderboard["M"][event] = event_leaderboard["M"][event].sort((a, b) => (a.score > b.score) ? 1 : -1);
//     });
    
// }

getTopThreeEvents();
let individual_event_list = ["50m Freestyle", "100m Freestyle", "200m Freestyle", "400m Freestyle", "50m Backstroke",
                  "100m Backstroke", "200m Backstroke", "50m Breaststroke", "100m Breaststroke", "200m Breaststroke",
                  "50m Butterfly", "100m Butterfly", "200m Butterfly", "200m Medley", "400m Medley"];
// addEvents(individual_event_list);

function addEvents(individual_event_list) {
    individual_event_list.forEach((event) => {
        TopEventModel.create({eventName: event, events: []}).then((obj) => {
            console.log(obj);
        }).catch((err) => {
            console.error(err);
        });
    });
}
function getTopThreeEvents() {
    SwimmerModel.find({}, (err, swimmers) => {
        swimmers.forEach((swimmer) => {
            EventModel.find({swimmerID: swimmer._id}).sort({score: -1}).limit(3).exec((err, res) => {
                res.forEach((event) => {
                    TopEventModel.findOneAndUpdate({eventName: event.eventName}, {$push: {events: event}}).then((obj) => {
                        console.log(obj);
                    }).catch((err) => {
                        console.error(err);
                    });
                });
            })
        })
    })
}


function getEventRank(swimmerID, event, swimmer_top_3) {
    return swimmer_top_3[swimmerID].findIndex(event);
}


// individual_event_list.forEach(function(event){
//     let sorted_events = EventModel.find({eventName: event}).sort({score: -1});
//     sorted_events.exec(function(err, res) {
//         if (err) {
//             console.log(err);
//         };
//         console.log(res);
//         res.forEach(function(event) {

//         });
//     })
// });

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);


mongoose.connect(process.env.DBCONNECTION, {autoIndex: false}).then(() => {
    console.log("DB Connected");
}).catch((error) =>{
    console.error(error);
})