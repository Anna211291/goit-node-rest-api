import { Schema, model } from "mongoose";
import Joi from "joi";

import {handleSaveError, addUpdateSettings} from "./hooks.js";

const contactSchema = new Schema(  {
    name: {
      type: String,
      required: [true, 'Set name for contact'],
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    favorite: {
      type: Boolean,
      default: false,
    }, 
  }, {versionKey: false, timestamps: true});

  contactSchema.post("save", handleSaveError);

  contactSchema.pre("findOneAndUpdate", addUpdateSettings);
  
  contactSchema.post("findOneAndUpdate", handleSaveError);


  export const createContactSchema = Joi.object({
    name: Joi.string().required().messages({
      "any.required": `Missing required name field`,
    }),
    email: Joi.string().required().messages({
      "any.required": `Missing required email field`,
    }),
    phone: Joi.string().required().messages({
      "any.required": `Missing required phone field`,
    }),
  });
  
  export const updateContactSchema = Joi.object({
    name: Joi.string(),
    email: Joi.string(),
    phone: Joi.string(),
  });

  export const contactUpdateFavoriteSchema = Joi.object({
    favorite: Joi.boolean().required().messages({"any.required": `Missing field favorite`})
})

  const Contact = model("contact", contactSchema);

  export default Contact;