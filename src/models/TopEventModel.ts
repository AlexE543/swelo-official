import { Model, model, Schema, Document } from 'mongoose';

export interface ITopEventModel extends Document{
    eventName: string,
    events: Array<any>
}

export const TopEventSchema: Schema = new Schema({
    eventName: String,
    events: [{
        type: Schema.Types.ObjectId,
        ref: 'Events'
    }]
})

export const TopEventModel: Model<ITopEventModel> = model<ITopEventModel>('TopEvent', TopEventSchema);