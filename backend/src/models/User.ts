import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUserDocument, UserRole } from '../types';

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.PATIENT,
      required: true,
      index: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    avatarUrl: {
      type: String
    },
    refreshTokenHash: {
      type: String
    },
    googleCalendarTokens: {
      accessToken: String,
      refreshToken: String,
      expiryDate: Number
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = model<IUserDocument>('User', userSchema);
