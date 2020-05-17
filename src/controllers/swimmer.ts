import * as express from "express";
import { SwimmerModel } from "../models/SwimmerModel";
import { resolve } from "dns";
import { rejects } from "assert";
import { EventModel } from "../models/EventModel";

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
    }
}