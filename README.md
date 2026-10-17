# Minecraft Enhanced

Minecraft Enhanced is a Bedrock Edition add-on that adds new equipment and small gameplay improvements while aiming to preserve the feel of vanilla Minecraft.

## Download and install

1. Open the [GitHub Releases](https://github.com/DomiusTheProgrammer/Minecraft-Enhanced/releases) page and download the `.mcaddon` file from the release you want.
2. Open the downloaded file with Minecraft to import the add-on.
3. In the world settings, enable both **Minecraft Enhanced - BP** and **Minecraft Enhanced - RP**.
4. Join the world and enjoy!

The pack manifests specify Minecraft **1.21.130 or newer** and the `@minecraft/server` Script API **2.0.0**.

## Features

- Custom tools made from steel, quartz, emerald, amethyst, and obsidian.
- Custom steel, quartz, emerald, and amethyst armor.
- Recipes for the added equipment and materials.
- Additional loot-table entries in selected structures.
- Tool interactions for stripping logs, tilling soil, creating dirt paths, and extinguishing campfires.
- Custom item textures and armor attachables.

## Source code

The source packs are in the repository root:

- `Minecraft Enhanced - BP/` — behavior pack, item definitions, recipes, loot tables, and scripts.
- `Minecraft Enhanced - RP/` — resource pack, textures, text, and attachables.

The main gameplay script is [`Minecraft Enhanced - BP/scripts/main.js`](Minecraft%20Enhanced%20-%20BP/scripts/main.js). The behavior pack manifest declares `@minecraft/server` version `2.0.0`.

To work on the add-on, edit the source files in these folders. To test changes in Minecraft, package the behavior and resource pack folders together as a `.mcaddon` or copy them into Minecraft's development pack folders.

## Contributing

Bug reports and suggestions are welcome. Please include your Minecraft version, steps to reproduce the issue, and any relevant error messages from the Content Log.
