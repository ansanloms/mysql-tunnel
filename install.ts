const cmd = "mysql-tunnel";
const baseUrl = `https://raw.githubusercontent.com/ansanloms/${cmd}`;
const version = "v0.0.1";

const cli = `${baseUrl}/${version}/cli.ts`;
const config = `${baseUrl}/${version}/deno.json`;

const configTemp = await Deno.makeTempFile({
  prefix: `${cmd}-`,
  suffix: ".json",
});

const configResponse = await fetch(config);
if (!configResponse.ok) {
  throw new Error(`HTTP error! status: ${configResponse.status}`);
}

await Deno.writeFile(
  configTemp,
  new Uint8Array(await configResponse.arrayBuffer()),
);

const command = new Deno.Command(Deno.execPath(), {
  args: ["install", "-gAfr", "-n", cmd, "-c", configTemp, "--no-lock", cli],
});

const { success, stderr } = await command.output();

if (success) {
  console.info("Successed.");
} else {
  throw new Error(new TextDecoder().decode(stderr));
}
