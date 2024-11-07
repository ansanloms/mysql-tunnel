const cmd = "mysql-tunnel";
const baseUrl = `https://raw.githubusercontent.com/ansanloms/${cmd}`;
const version = "v0.0.1";

const cli = `${baseUrl}/${version}/cli.ts`;
const config = `${baseUrl}/${version}/deno.json`;
const lock = `${baseUrl}/${version}/deno.lock`;

const getTempFile = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const tempFile = await Deno.makeTempFile();

  await Deno.writeFile(
    tempFile,
    new Uint8Array(await response.arrayBuffer()),
  );

  return tempFile;
};

const command = new Deno.Command(Deno.execPath(), {
  args: [
    "install",
    "--global",
    "--reload",
    "--force",
    "--allow-all",
    "--name",
    cmd,
    "--config",
    await getTempFile(config),
    "--lock",
    await getTempFile(lock),
    cli,
  ],
  stdin: "piped",
  stdout: "piped",
});

const child = command.spawn();

child.stdout.pipeTo(
  Deno.openSync("output", { write: true, create: true }).writable,
);

child.stdin.close();

const status = await child.status;
Deno.exit(status.code);
