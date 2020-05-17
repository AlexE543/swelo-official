import { Model, model, Schema, Document } from 'mongoose';

export interface IUserModel extends Document{
    email: string,
    password: string,
    salt: string,
    firstName: string,
    lastName: string,
    resetPasswordToken: string,
    resetPasswordExpiration: Date,
}

export const UserSchema: Schema = new Schema({
    email: String,
    password: String,
    salt: String,
    firstName: String,
    lastName: String,
    resetPasswordToken: String,
    resetPasswordExpiration: Date,
})

UserSchema.set('toJSON', {
    transform: (doc, ret, options) => {
      ret.$type = 'User';
      ret.id = ret._id;
      delete ret.password;
      delete ret.salt;
      return ret;
    }
});
  

export const UserModel: Model<IUserModel> = model<IUserModel>('User', UserSchema);