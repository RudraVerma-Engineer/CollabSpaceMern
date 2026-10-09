/** Turns an axios / socket / generic error into a user-facing message. */
export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.response?.data?.message || error?.message || fallback;
