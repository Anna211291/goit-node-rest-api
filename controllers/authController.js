import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import gravatar from "gravatar";
import { nanoid } from "nanoid";

import User from "../models/User.js";

import { HttpError, sendEmail } from "../helpers/index.js";

import { ctrlWrapper } from "../decorators/index.js";
import { rename } from "fs";

const { JWT_SECRET, BASE_URL } = process.env;

const avatarPath = path.resolve("public", "avatars");

const singup = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use");
  }

  let avatarURL = gravatar.url(email, { s: "200", r: "pg", d: "mp" }, false);

  if (req.file) {
    const { path: oldPath, filename } = req.file;
    const newPath = path.join(avatarPath, filename);
    await fs.rename(oldPath, newPath);
    avatarURL = path.join("avatars", filename);
  }

  const hashPassword = await bcrypt.hash(password, 10);
const verificationToken = nanoid();

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken
  });

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${verificationToken}">Click to verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
      avatarURL: newUser.avatarURL,
    },
  });
};

const verify = async (req, res) => {

const {verificationToken} = req.params;
const user = await User.findOne({verificationToken});
if(!user) {
  throw HttpError(404, "User not found")
}
await User.findByIdAndUpdate(user._id, {verify: true, verificationToken: 0})
res.json({
  message: "Verification seccessful"
})
}

const resendVerifyEmail = async(req, res) => {

const {email} = req.body;
const user = await User.findOne({email});

if (!user) {
  throw HttpError( 404, "Email not found")
}

if( user.verify) {
  throw HttpError(400, "Verification has already been passed")
}

const verifyEmail = {
  to: email,
  subject: "Verify email",
  html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${user.verificationToken}">Click to verify email</a>`,
};

await sendEmail(verifyEmail);

res.json({
  message: "Verification email sent"
})

}

const signin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

if (!user.verify) {
  throw HttpError(404, "User not verify")
}
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }

  const { _id: id } = user;
  const payload = {
    id,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
  await User.findByIdAndUpdate(id, { token });

  res.json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;

  res.json({
    email,
    subscription,
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  res.status(204).json();
};

const updateAvatar = async (req, res) => {
  const {_id} = req.user;

  if (!req.file) {
    throw HttpError(400, "No file uploaded");
  } 
   const { path: oldPath, filename } = req.file;
  const newPath = path.join(avatarPath, filename);
  await fs.rename(oldPath, newPath);
  const avatarURL = path.join("avatars", filename);

  const result = await User.findOneAndUpdate(_id, {avatarURL}, { new: true });

  if (!result) {
    throw HttpError(401, "Not authorized");
  }

  if (req.user.avatarURL) {
		const oldAvatarPath = path.join(path.resolve("public", req.user.avatarURL));
    try {await fs.unlink(oldAvatarPath);}
		catch (err) {
      console.log(err);
    }
	}

  res.json({
      avatarURL: result.avatarURL
  });

}
export default {
  singup: ctrlWrapper(singup),
  verify: ctrlWrapper(verify),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  signin: ctrlWrapper(signin),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateAvatar: ctrlWrapper(updateAvatar),
};
