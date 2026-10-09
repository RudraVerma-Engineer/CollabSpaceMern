import { useCallback, useEffect, useState } from "react";

import { getErrorMessage } from "../utils/errors.js";

/**
 * Infinite "load more" list.
 *
 *   const list = usePaginatedList(
 *     (page) => getProjects({ ...filters, page }),
 *     "projects",
 *     [filters],
 *   );
 *
 * - `fetchPage(page)` must return the API response ({ data: { [itemsKey], pagination } })
 * - the list resets to page 1 whenever `deps` change
 */
export const usePaginatedList = (fetchPage, itemsKey, deps = []) => {
  const filterKey = JSON.stringify(deps);

  const [state, setState] = useState({
    filterKey: null,
    items: [],
    pagination: null,
    error: "",
  });
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchPage(1)
      .then((response) => {
        if (cancelled) return;
        setState({
          filterKey,
          items: response.data[itemsKey],
          pagination: response.data.pagination,
          error: "",
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ filterKey, items: [], pagination: null, error: getErrorMessage(error) });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const loading = state.filterKey !== filterKey;

  const loadMore = useCallback(async () => {
    if (!state.pagination?.hasNextPage || loadingMore) return;

    setLoadingMore(true);
    try {
      const response = await fetchPage(state.pagination.page + 1);

      setState((previous) => ({
        ...previous,
        items: [...previous.items, ...response.data[itemsKey]],
        pagination: response.data.pagination,
      }));
    } catch (error) {
      setState((previous) => ({ ...previous, error: getErrorMessage(error) }));
    } finally {
      setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pagination, loadingMore, filterKey]);

  const addItem = useCallback(
    (item) => setState((previous) => ({ ...previous, items: [item, ...previous.items] })),
    [],
  );

  const removeItem = useCallback(
    (id) =>
      setState((previous) => ({
        ...previous,
        items: previous.items.filter((item) => item._id !== id),
      })),
    [],
  );

  const updateItem = useCallback(
    (id, changes) =>
      setState((previous) => ({
        ...previous,
        items: previous.items.map((item) => (item._id === id ? { ...item, ...changes } : item)),
      })),
    [],
  );

  return {
    items: loading ? [] : state.items,
    loading,
    loadingMore,
    error: loading ? "" : state.error,
    hasMore: !loading && Boolean(state.pagination?.hasNextPage),
    loadMore,
    addItem,
    removeItem,
    updateItem,
  };
};
