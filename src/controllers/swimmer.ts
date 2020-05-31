import * as express from "express";
import { SwimmerModel } from "../models/SwimmerModel";
import { resolve } from "dns";
import { rejects } from "assert";
import { EventModel } from "../models/EventModel";
import getWinOdds from "../scripts/get_probabilities";

export class SwimmerController {
    constructor (app) {
        SwimmerModel.init()

        app.get('/swimmer/:swimmerId', async (req, res) => {
            try {
                let obj = await SwimmerModel.findById(req.params.swimmerId);
                res.send(obj);
            } catch (err) {
                console.error(err);
                res.status(500).send('Unknown Error');
            }
        })

        app.get('/leaderboard/:gender', async (req, res) => {
            try {
                let obj = await SwimmerModel.find({sex: req.params.gender}).sort({elo: -1});
                res.send(obj);
            } catch (err) {
                console.error(err);
                res.status(500).send("Unknown Error");
            }
        })

        app.get('/market/:eventName', async (req, res) => {
            try {
                if (req.params.eventName != "Men's 100m Butterfly") {
                    console.log("Event DNE Yet");
                } else {
                    let eventData = {
                        odds: [],
                        ranks: {
                            1: "Caeleb Dressel",
                            2: "Tom Shields",
                            3: "Jan Switkowski",
                            4: "Jack Conger",
                            5: "Chad Le Clos",
                            6: "Vini Lanza",
                            7: "Kregor Zirk",
                            8: "James Guy",
                        }, 
                        lanes: {
                            "Kregor Zirk": 1,
                            "Chad Le Clos": 2,
                            "Jan Switkowski": 3,
                            "Caeleb Dressel": 4,
                            "Tom Shields": 5,
                            "Jack Conger": 6,
                            "Vini Lanza": 7,
                            "James Guy": 8,
                        }
                    }
                    let e = [["Dressel Caeleb", 1], ["Shields Tom", 2], ["Switkowski Jan", 3], ["Conger Jack", 4], 
                            ["Le Clos Chad", 5], ["Lanza Vini", 6], ["Zirk Kregor", 7], ["Guy James", 8]];
                    eventData["odds"] = await getWinOdds(e);
                    console.log(eventData);
                    res.send(eventData);
    
                }
            } catch (err) {
                console.error(err);
                res.status(500).send("Unknown Error");
            }
        })
    }
}