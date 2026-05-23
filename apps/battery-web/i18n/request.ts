import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // For now, hardcode to English. Future: detect from cookie / Accept-Language header.
  const locale = "en";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
