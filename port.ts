import $ from "@david/dax";

const isUsingPort = (port: number) => {
  try {
    const ac = new AbortController();
    Deno.serve({
      port,
      handler: () => new Response(),
      signal: ac.signal,
      onListen: () => {},
    });
    ac.abort();

    return false;
  } catch (error) {
    if (typeof error !== "object" || String(error?.code) !== "EADDRINUSE") {
      throw error;
    }

    return true;
  }
};

export function assertPort(x: unknown): asserts x is number {
  if (typeof x !== "number") {
    throw new TypeError("port must be numeric.");
  }

  if (!Number.isSafeInteger(x)) {
    throw new TypeError("port must be integer.");
  }

  if (x < 1) {
    throw new RangeError("port must be greater than or equal to 1.");
  }

  if (x > 65535) {
    throw new RangeError("port must be less than or equal to 65535.");
  }
}

export const getEphemeralPort = (
  range: { min: number; max: number } = { min: 32768, max: 65535 },
) => {
  assertPort(range.min);
  assertPort(range.max);
  if (range.min >= range.max) {
    throw new RangeError("range.min must be less than or equal to range.max.");
  }

  return [...Array(range.max - range.min).keys()]
    .map((i) => i + range.min)
    .toSorted(() => Math.random() - Math.random())
    .find((port) => !isUsingPort(port));
};

export const isListenPort = async (port: number) => {
  if (Deno.build.os === "windows") {
    return (await $`netstat -an | findstr 127.0.0.1:${port} | findstr LISTENING`)
      .code === 0;
  } else {
    return (await $`netstat -tuln | grep "127.0.0.1:${port}" | grep LISTEN`)
      .code === 0;
  }
};
