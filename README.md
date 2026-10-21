# Minecraft Enhanced

Minecraft Enhanced is a Bedrock Edition add-on that adds new equipment and small gameplay improvements while aiming to preserve the feel of vanilla Minecraft.

The latest release is **1.1.5**.

## Download and install

1. Open the [GitHub Releases](https://github.com/DomiusTheProgrammer/Minecraft-Enhanced/releases) page and download the `.mcaddon` file from the release you want.
2. Open the downloaded file with Minecraft to import the add-on.
3. In the world settings, enable both **Minecraft Enhanced - BP** and **Minecraft Enhanced - RP**.
4. Join the world and enjoy!

The pack manifests specify Minecraft **1.21.130 or newer** and the `@minecraft/server` Script API **2.0.0**.

## Features

- Custom tools made from bronze, steel, quartz, emerald, amethyst, and obsidian.
- Custom bronze, steel, quartz, emerald, and amethyst armor.
- Tin ore, tin materials, and bronze and steel storage blocks.
- Recipes for the added equipment, materials, and blocks.
- Additional loot-table entries in selected structures.
- Tool interactions for stripping logs, tilling soil, creating dirt paths, and extinguishing campfires.
- Custom item textures and armor attachables.

## What's new in 1.1.5

- Added bronze and steel blocks.
- Organized armor and tool definitions into material-specific folders.
- Updated tin block and ore definitions.
- Fixed the effect applied by the full emerald armor set.
- Updated pack versions and removed the Beta label.

## Source code

The source packs are in the repository root:

- `Minecraft Enhanced - BP/` — behavior pack, item definitions, recipes, loot tables, and scripts.
- `Minecraft Enhanced - RP/` — resource pack, textures, text, and attachables.

The main gameplay script is [`Minecraft Enhanced - BP/scripts/main.js`](Minecraft%20Enhanced%20-%20BP/scripts/main.js). The behavior pack manifest declares `@minecraft/server` version `2.0.0`.

To work on the add-on, edit the source files in these folders. To test changes in Minecraft, package the behavior and resource pack folders together as a `.mcaddon` or copy them into Minecraft's development pack folders.

## Contributing

Bug reports and suggestions are welcome. Please include your Minecraft version, steps to reproduce the issue, and any relevant error messages from the Content Log.
