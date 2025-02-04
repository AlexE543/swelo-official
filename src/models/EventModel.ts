import { Model, model, Schema, Document } from 'mongoose';

export interface IEventModel extends Document{
    eventName: string,
    time: string,
    course: string,
    score: number,
    sex: string,
    swimmerID: Schema.Types.ObjectId

}

export const EventSchema: Schema = new Schema({
    eventName: String,
    time: String,
    course: String,
    score: Number,
    sex: String,
    swimmerID: Schema.Types.ObjectId
})

export const EventModel: Model<IEventModel> = model<IEventModel>('Event', EventSchema);