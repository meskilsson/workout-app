// Include response-body reads in the deadline, not just response headers.
export async function workoutRequest(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
    const controller = new AbortController();
    const abort = () => controller.abort(options.signal?.reason);
    if (options.signal?.aborted) abort();
    else options.signal?.addEventListener("abort", abort, { once: true });
    let timeout: ReturnType<typeof setTimeout>;
    const deadline = new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
            reject(new Error("The workout request timed out. Your progress has been kept. Please try again."));
            controller.abort();
        }, timeoutMs);
    });
    try {
        return await Promise.race([
            (async () => {
                const response = await fetch(url, { ...options, signal: controller.signal });
                const body = await response.arrayBuffer();
                return new Response(response.status === 204 ? null : body, {
                    status: response.status, statusText: response.statusText, headers: response.headers,
                });
            })(),
            deadline,
        ]);
    } finally {
        clearTimeout(timeout!);
        options.signal?.removeEventListener("abort", abort);
    }
}
