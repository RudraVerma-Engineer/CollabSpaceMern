import AppError from "../utils/AppError.js";

const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      // allowUnknown: false,
    });
    if (error) {
      const messages = error.details.map((detail) => detail.message);

      return next(new AppError(messages.join(","), 400));
    }

    if (property === "query") {
      req.validatedQuery = value;
    } else {
      req[property] = value;
    }
    next();
  };
};

export default validate;
