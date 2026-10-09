import api from "./api.js";

/** Uploads one file; resolves with { url, name, mimeType, size }. */
export const uploadFile = async (file) => {
  const form = new FormData();
  form.append("file", file);

  const response = await api.post("/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.data.file;
};
