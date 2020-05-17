require('dotenv').config();
import * as express from "express";
import * as mongoose from "mongoose";
import { SwimmerController } from "./controllers/swimmer";
import * as bodyParser from "body-parser";
const cors = require("cors");
import Passport = require('passport');
import Bearer = require('passport-http-bearer');
import { UserModel } from "./models/UserModel";
import { TokenModel} from "./models/TokenModel";
import { UserController } from "./controllers/user";


const app = express()
const port = parseInt(process.env.PORT)

Passport.use(
    'loginToken',
    new Bearer.Strategy((token, done) => {
        TokenModel.findOne({token: token}).populate("userId").then((found) => {
            done(null, found.userId, null); // error, what you want, no clue
        }).catch((err) => {
            console.log(err);
            done("User not found", null, null);
        })
    })
);

app.use(cors());

Passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
Passport.deserializeUser(function(user, done) {
done(null, user);
});
  

app.use(Passport.initialize());

app.use(bodyParser.json({ limit: '50mb' }));

app.get('/', (req, res) => res.send('Hello World!'))

new SwimmerController(app)
new UserController(app);

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