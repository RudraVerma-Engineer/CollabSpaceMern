import { useCallback, useEffect, useState } from "react";

import { getErrorMessage } from "../utils/errors.js";

/**
 * Loads data when `deps` change.
 *
 *   const { data, loading, error, reload, setData } =
 *     useFetch(() => getProject(id), [id]);
 *
 * `data` keeps the previous value while reloading, so the screen doesn't
 * flash empty after an action.
 */
export const useFetch = (fetcher, deps = []) => {
  const requestKey = JSON.stringify(deps);

  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  useEffect(() => {
    let cancelled = false;
    const key = `${requestKey}:${reloadCount}`;

    fetcher()
      .then((response) => {
        if (!cancelled) setResult({ key, data: response.data, error: "" });
      })
      .catch((error) => {
        if (!cancelled) {
          setResult((previous) => ({ key, data: previous.data, error: getErrorMessage(error) }));
        }
      });

    return () => {
      cancelled = true;
    };
    // `fetcher` is intentionally not a dependency: callers pass inline arrows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  const setData = useCallback(
    (updater) =>
      setResult((previous) => ({
        ...previous,
        data: typeof updater === "function" ? updater(previous.data) : updater,
      })),
    [],
  );

  return {
    data: result.data,
    error: result.error,
    loading: result.key !== `${requestKey}:${reloadCount}`,
    reload,
    setData,
  };
};
