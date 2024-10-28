import $ from "@david/dax";
import { parseArgs } from "@std/cli/parse-args";
import { assert, is } from "@core/unknownutil";
import { assertPort, getEphemeralPort, isListenPort } from "./port.ts";

const args = parseArgs(
  Deno.args.map((arg) => {
    if (arg.startsWith("-p")) {
      const v = arg.substring("-p".length);
      if (v.length > 0) {
        return ["-p", v];
      }
    }

    return arg;
  }).flat(),
);

const tunnelPort = getEphemeralPort();
assertPort(tunnelPort);

const host = args.host ?? args.h ?? undefined;
assert<string>(host, is.String);

const port = Number(args.port ?? args.P ?? 3306);
assertPort(port);

const tunnelDestination = args._.at(0);
assert<string>(tunnelDestination, is.String);

const mysqlArgs = (() => {
  const result: (string | number)[] = [];

  Object.entries(args).forEach(([key, value]) => {
    if (key === "_") {
      result.push(...value.slice(1));
      return;
    }

    if (key === "p") {
      result.push(`-p${value}`);
      return;
    }

    if (!["host", "h", "port", "P"].includes(key)) {
      if (key.length === 1) {
        result.push(`-${key}`);
      } else {
        result.push(`--${key}`);
      }

      if (value !== true) {
        result.push(value);
      }

      return;
    }
  });

  return result;
})();

const tunnel = $`ssh ${tunnelDestination} -NL ${tunnelPort}:${host}:${port}`
  .spawn();

const listen = setInterval(async () => {
  if (await isListenPort(tunnelPort)) {
    clearInterval(listen);

    const mysql =
      await $`mysql --host 127.0.0.1 --port ${tunnelPort} ${mysqlArgs}`;
    tunnel.kill();
    Deno.exit(mysql.code);
  }
}, 1000);
