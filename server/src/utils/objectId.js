import mongoose from "mongoose";

import AppError from "./AppError.js";

/** Throws a 400 when `id` is not a valid MongoDB ObjectId. */
export const assertValidObjectId = (id, label = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
};

/** Works for ObjectIds, strings and populated documents (`{ _id }`). */
export const toIdString = (value) => (value?._id ?? value)?.toString();

export const isSameId = (a, b) => toIdString(a) === toIdString(b);
