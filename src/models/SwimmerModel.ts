import { Model, model, Schema, Document } from 'mongoose';
import { Interface } from 'readline';

export interface ISwimmerModel extends Document{
    firstName: string,
    lastName: string,
    sex: string,
    team: string,
    swimRankingId: string,
    elo: number,
    events: Array<any>
}

export const SwimmerSchema: Schema = new Schema({
    firstName: String,
    lastName: String,
    sex: String,
    team: String,
    swimRankingId: String,
    elo: Number,
    events: [{
        type: Schema.Types.ObjectId,
        ref: 'Events'
    }]
})

export const SwimmerModel: Model<ISwimmerModel> = model<ISwimmerModel>('Swimmer', SwimmerSchema);