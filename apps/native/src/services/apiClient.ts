const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("Missing EXPO_PUBLIC_API_URL");
}

type ApiFetchOptions = RequestInit & {
  token?: string | null;
  retried?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
let onUnauthorized: (() => void) | undefined;
export function setUnauthorizedHandler(handler?: () => void) {
  onUnauthorized = handler;
}
let renew: (() => Promise<string | null>) | undefined;
let renewal: Promise<string | null> | null = null;
const renewedTokens = new Map<string, string>();
let expiredToken: string | null = null;
export function resetApiSession() {
  renewedTokens.clear();
  expiredToken = null;
}
export function setTokenRenewal(handler?: () => Promise<string | null>) {
  renew = handler;
  resetApiSession();
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { token, headers, retried, ...restOptions } = options;

  const controller = new AbortController();
  const abort = () => controller.abort();
  if (restOptions.signal?.aborted) abort();
  restOptions.signal?.addEventListener("abort", abort, { once: true });
  const deadline = setTimeout(abort, 20000);
  let response: Response;
  let data: any;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...restOptions,
      signal: controller.signal,
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Client": "native",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
    data = await response.json().catch(() => null);
    if (controller.signal.aborted) throw new Error("Request timed out");
  } catch {
    throw new ApiError(
      "Unable to connect. Check your connection and try again.",
      0,
    );
  } finally {
    clearTimeout(deadline);
    restOptions.signal?.removeEventListener("abort", abort);
  }

  if (!response.ok) {
    if (
      response.status === 401 &&
      token &&
      renew &&
      !retried &&
      data?.code === "ACCESS_TOKEN_EXPIRED"
    ) {
      renewal ??= (
        renewedTokens.has(token)
          ? Promise.resolve(renewedTokens.get(token)!)
          : renew()
      ).finally(() => {
        renewal = null;
      });
      let renewedToken: string | null;
      try {
        renewedToken = await renewal;
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 401 &&
          expiredToken !== token
        ) {
          expiredToken = token;
          onUnauthorized?.();
        }
        throw error;
      }
      if (renewedToken && renewedToken !== token) {
        renewedTokens.set(token, renewedToken);
        return apiFetch<T>(path, {
          ...options,
          token: renewedToken,
          retried: true,
        });
      }
    }
    if (response.status === 401 && token && expiredToken !== token) {
      expiredToken = token;
      onUnauthorized?.();
    }
    const fields = Object.fromEntries(
      (Array.isArray(data?.errors) ? data.errors : [])
        .filter(
          (issue: { field?: string; message?: string } | null) =>
            issue &&
            typeof issue.field === "string" &&
            typeof issue.message === "string",
        )
        .map((issue: { field: string; message: string }) => [
          issue.field,
          issue.message,
        ]),
    );
    throw new ApiError(
      response.status >= 500
        ? "Something went wrong. Please try again."
        : data?.message || "Request failed",
      response.status,
      fields,
    );
  }

  if (response.status !== 204 && data === null)
    throw new ApiError(
      "Something went wrong. Please try again.",
      response.status,
    );
  return data;
}
