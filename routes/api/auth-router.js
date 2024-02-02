import express from "express";

import { isEmptyBody, authenticate, upload, resizeAvatar} from "../../middlewares/index.js";

import { validateBody } from "../../decorators/index.js";

import { userSignupAndSinginSchema, userEmailSchema } from "../../models/User.js";

import authController from "../../controllers/authController.js";

const authRouter = express.Router();

authRouter.post(
  "/register", upload.single("avatarURL"),
  isEmptyBody,
  validateBody(userSignupAndSinginSchema),
  authController.singup
);

authRouter.get("/verify/:verificationToken", authController.verify);

authRouter.post("/verify", isEmptyBody, validateBody(userEmailSchema), authController.resendVerifyEmail)

authRouter.post(
  "/login",
  isEmptyBody,
  validateBody(userSignupAndSinginSchema),
  authController.signin
);

authRouter.post("/logout", authenticate, authController.logout);

authRouter.get("/current", authenticate, authController.getCurrent);

authRouter.patch("/avatars", authenticate,upload.single("avatarURL"),  resizeAvatar, authController.updateAvatar);

export default authRouter;
