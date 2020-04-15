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
    }
}