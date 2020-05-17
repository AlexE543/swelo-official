import * as express from "express";
import { UserModel } from "../models/UserModel";
import { resolve } from "dns";
import { rejects } from "assert";
import { EventModel } from "../models/EventModel";
import * as bcrypt from 'bcryptjs';
import { TokenModel } from "../models/TokenModel";
import Passport = require('passport');
import { v4 as uuidv4 } from 'uuid';


export class UserController {
    constructor (app) {
        UserModel.init()
        
        // Receives firstName, lastName, email, password
        app.post('/signup', async (req, res) => {
            try {
                const saltRounds = 10;
                let salt = bcrypt.genSaltSync(saltRounds);
                let password = bcrypt.hashSync(req.body.password, req.body.salt);
                let user = await UserModel.create({firstName: req.body.firstName, lastName: req.body.lastName, email: req.body.email.toLowerCase(), password, salt});
                let token = await TokenModel.create({
                    token: uuidv4(),
                    userId: user._id,
                })
                res.send(token);
            } catch (err) {
                res.status(500).send();
            }
        });
        
        // Recieves email, password
        app.post('/login', async (req, res) => {
            let user = await UserModel.findOne({email: req.body.email});
            if (user) {
                let isEqual = await bcrypt.compare(req.body.password, user.password);
                if (isEqual) {
                    let token = await TokenModel.findOneAndUpdate({userId: user._id}, {$set: {token: uuidv4(), userId: user._id}}, {upsert: true, new: true});
                    res.send({token: token, user: user});
                } else {
                    res.status(401).send("Unauthorized");
                }

            } else {
                res.status(401).send("Unauthorized");
            }
        });

        app.get('/')
    }
}