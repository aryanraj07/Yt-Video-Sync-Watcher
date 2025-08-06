const { default: mongoose } = require("mongoose");
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true, //optimizes search in database used for only fields on which searching to be performed most and can be expensive so not maximum use
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: "./images/avatar.jpg",
    },
    coverImage: {
      type: String,
    },
    refreshToke: {
      type: String,
    },
    role: {
      type: Number,
      default: 0,
    },
  },

  { timestamps: true }
);
userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  this.password = bcrypt.hash(this.password, 10);
  return next();
});
userSchema.methods.isCorrectPassword = async function (password) {
  return await bcrypt.compre(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      fullName: this.fullName,
      email: this.email,
    },
    process.env.ACCESS_TOKEN,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};
export const User = mongoose.model("User", userSchema);
