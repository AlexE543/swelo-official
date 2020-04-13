import * as express from "express";
import { SwimmerModel } from "../models/SwimmerModel";
import { resolve } from "dns";
import { rejects } from "assert";
import { EventModel } from "../models/EventModel";
// var swim_data = require('C:/Users/Alex Ellison/Desktop/Swelo-official/swelo-official/backup_LCM_data.json');


export class SwimmerController {
    constructor (app) {
        SwimmerModel.init()
        app.get("/swimmer", async (req, res) => {
            try {
                let obj = await SwimmerModel.findById(req.query.swimmerId);
                res.send(obj)
            } catch (err) {
                console.error(err);
                res.status(500).send('Unknown Error');
            }
        })
        SwimmerModel.find({}, function(err, swimmers) {
                console.log(swimmers)
                swimmers.forEach(function(swimmer) {
                    console.log(swimmer);
                    var events = EventModel.find({swimmerID: swimmer._id}).sort({score: -1}).limit(3);
                    events.exec(function(err, res) {
                        console.log(res);
                    })
                });
            });
            
        // One time to add existing current swimmers in ISL to DB
        
        // for (var i=0;i<swim_data["athletes"].length;i++) {
        //     var name = swim_data["athletes"][i]["athlete-name"].split(" ");
        //     var first = name.slice(0, Math.floor(name.length/2)).join(" ");
        //     var last = name.slice(Math.floor(name.length/2),).join(" ");
        //     var athlete = {
        //         firstName: first,
        //         lastName: last,
        //         sex: swim_data["athletes"][i]["Sex"],
        //         country: swim_data["athletes"][i]["athlete-country"],
        //         team: swim_data["athletes"][i]["Team"]
        //     }
        //     console.log(athlete);
        //     SwimmerModel.create(athlete).then((obj) => {
        //         console.log(obj._id);
        //     }).catch((error) => {
        //         console.error(error);
        //     })
        // }

        // One time to add existing events to DB

        // SwimmerModel.find({}, function(err, swimmers) {
        //     var swimmerMap = {}
        //     swimmers.forEach(function(swimmer) {
        //         var name = swimmer.firstName + " " + swimmer.lastName;
        //         swimmerMap[swimmer.firstName + " " + swimmer.lastName] = swimmer._id;
        //     });
        //     swim_data["athletes"].forEach(function(athlete) {
        //         for (var i=0;i<athlete["events"].length;i++) {
        //             var event = {
        //                 eventName: athlete["events"][i],
        //                 time: athlete["times"][i],
        //                 course: athlete["courses"][i],
        //                 score: parseInt(athlete["scores"][i]),
        //                 swimmerID: swimmerMap[athlete["athlete-name"]]
        //             }
        //             EventModel.create(event).then((obj) => {
        //                 console.log(obj._id);
        //             }).catch((error) => {
        //                 console.log(error)
        //             })
        //         }
        //     });
        // });

        // One time to add events to each persons event list

        // SwimmerModel.find({}, function(err, swimmers) {
        //     swimmers.forEach(function(swimmer) {
        //         EventModel.find({swimmerID: swimmer._id}, function(err, events) {
        //             SwimmerModel.findByIdAndUpdate(swimmer._id, {events: events}, function(error, res) {
        //                 console.log(res);
        //             })
        //         })
        //     });
        // });
    }
}