import { Schema } from "mongoose";
import { EMPTY_LOCALIZED_TEXT } from "../utils/localizationContract.js";

export { EMPTY_LOCALIZED_TEXT };

export const localizedTextSchema = new Schema(
  {
    en: { type: String, default: "" },
    be: { type: String, default: "" },
    pl: { type: String, default: "" }
  },
  { _id: false }
);
