require('dotenv').config();
import * as express from "express";
import * as mongoose from "mongoose";
import { SwimmerController } from "./controllers/swimmer";
import * as bodyParser from "body-parser";

const app = express()
const port = parseInt(process.env.PORT)

app.use(bodyParser.json({ limit: '50mb' }));

app.get('/', (req, res) => res.send('Hello World!'))

new SwimmerController(app)

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);


mongoose.connect(process.env.DBCONNECTION, {autoIndex: false}).then(() => {
    console.log("DB Connected");
}).catch((error) =>{
    console.error(error);
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))