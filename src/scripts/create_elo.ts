import { SwimmerModel, SwimmerSchema } from "../models/SwimmerModel";
import { EventModel } from "../models/EventModel";
import * as mongoose from "mongoose";
import { type } from "os";
import { TopEventModel } from "../models/TopEventModel";
require('dotenv').config();

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);


mongoose.connect(process.env.DBCONNECTION, {autoIndex: false}).then(() => {
    console.log("DB Connected");
}).catch((error) =>{
    console.error(error);
})