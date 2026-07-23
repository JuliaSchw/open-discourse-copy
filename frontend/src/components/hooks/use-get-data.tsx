import { useEffect, useState } from "react";

export const useGetData = <T,>(
  path: string,
  responseCallback: (response: Record<string, any>) => T,
): [T | undefined, () => void] => {
  const [data, setData] = useState<T>();
  const fetchQuery = () => {
    (async () => {
      const baseUrl =
        process.env.NEXT_PUBLIC_PROXY_ENDPOINT || "http://localhost:5300";

      console.log("baseUrl", baseUrl);

      const searchResult = await fetch(baseUrl + "/" + path, {
        mode: "cors",
      }).then((response) => response.json());
      const dataResult = responseCallback(searchResult.data);
      if (dataResult) {
        setData(dataResult);
      }
    })();
  };
  useEffect(() => fetchQuery(), []);
  return [data, fetchQuery];
};
