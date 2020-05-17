import { Model, model, Schema, Document, SchemaDefinition } from 'mongoose';

export interface ITokenModel extends Document{
    token: string,
    userId: string,
}

export const TokenSchema: Schema = new Schema({
    token: String,
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
})

export const TokenModel: Model<ITokenModel> = model<ITokenModel>('Token', TokenSchema);