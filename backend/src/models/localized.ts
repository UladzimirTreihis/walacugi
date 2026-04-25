import { Schema } from "mongoose";

export const EMPTY_LOCALIZED_TEXT = { en: "", be: "", pl: "" };

export const localizedTextSchema = new Schema(
  {
    en: { type: String, default: "" },
    be: { type: String, default: "" },
    pl: { type: String, default: "" }
  },
  { _id: false }
);
