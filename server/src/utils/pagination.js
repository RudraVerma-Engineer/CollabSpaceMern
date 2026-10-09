export const getSkip = ({ page = 1, limit = 20 }) => (page - 1) * limit;

export const buildPagination = ({ page = 1, limit = 20, total }) => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};
