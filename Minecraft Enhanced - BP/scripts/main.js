import { system, world, GameMode, EquipmentSlot } from "@minecraft/server";

const toolTypes = new Set(["axe", "hoe", "pickaxe", "shovel"]);

const effectiveBlockTags = new Map([
  ["axe", ["wood", "minecraft:is_axe_item_destructible"]],
  ["hoe", ["plant", "crop", "leaves", "minecraft:is_hoe_item_destructible"]],
  [
    "pickaxe",
    [
      "stone",
      "iron_pick_diggable",
      "minecraft:is_pickaxe_item_destructible",
    ],
  ],
  [
    "shovel",
    [
      "dirt",
      "sand",
      "gravel",
      "snow",
      "minecraft:is_shovel_item_destructible",
    ],
  ],
]);

const strippedWood = new Map([
  ["minecraft:oak_log", "minecraft:stripped_oak_log"],
  ["minecraft:spruce_log", "minecraft:stripped_spruce_log"],
  ["minecraft:birch_log", "minecraft:stripped_birch_log"],
  ["minecraft:jungle_log", "minecraft:stripped_jungle_log"],
  ["minecraft:acacia_log", "minecraft:stripped_acacia_log"],
  ["minecraft:dark_oak_log", "minecraft:stripped_dark_oak_log"],
  ["minecraft:mangrove_log", "minecraft:stripped_mangrove_log"],
  ["minecraft:cherry_log", "minecraft:stripped_cherry_log"],
  ["minecraft:poplar_log", "minecraft:stripped_poplar_log"],

  ["minecraft:oak_wood", "minecraft:stripped_oak_wood"],
  ["minecraft:spruce_wood", "minecraft:stripped_spruce_wood"],
  ["minecraft:birch_wood", "minecraft:stripped_birch_wood"],
  ["minecraft:jungle_wood", "minecraft:stripped_jungle_wood"],
  ["minecraft:acacia_wood", "minecraft:stripped_acacia_wood"],
  ["minecraft:dark_oak_wood", "minecraft:stripped_dark_oak_wood"],
  ["minecraft:mangrove_wood", "minecraft:stripped_mangrove_wood"],
  ["minecraft:cherry_wood", "minecraft:stripped_cherry_wood"],
  ["minecraft:poplar_wood", "minecraft:stripped_poplar_wood"],

  ["minecraft:crimson_stem", "minecraft:stripped_crimson_stem"],
  ["minecraft:crimson_hyphae", "minecraft:stripped_crimson_hyphae"],
  ["minecraft:warped_stem", "minecraft:stripped_warped_stem"],
  ["minecraft:warped_hyphae", "minecraft:stripped_warped_hyphae"],
  ["minecraft:bamboo_block", "minecraft:stripped_bamboo_block"],
]);

const tillableBlocks = new Set([
  "minecraft:grass_block",
  "minecraft:dirt",
  "minecraft:coarse_dirt",
]);

const pathBlocks = new Set([
  "minecraft:grass_block",
  "minecraft:dirt",
  "minecraft:podzol",
  "minecraft:coarse_dirt",
  "minecraft:mycelium",
  "minecraft:rooted_dirt",
]);

function isModTool(item) {
  return item?.typeId.startsWith("me:") === true;
}

function getToolType(item) {
  return item.typeId.slice(3).split("_").pop();
}

function getMainhand(entity) {
  const equippable = entity.getComponent("minecraft:equippable");
  const slot = equippable?.getEquipmentSlot(EquipmentSlot.Mainhand);
  const item = slot?.getItem();

  return slot && item ? { slot, item } : undefined;
}

function damageHeldTool(player, expectedTypeId, amount = 1) {
  // @minecraft/server 2.x uses GameMode.Creative (PascalCase), 1.x used .creative
  if (String(player.getGameMode()).toLowerCase() === "creative") return;

  const held = getMainhand(player);
  if (!held || held.item.typeId !== expectedTypeId) return;

  const durability = held.item.getComponent("minecraft:durability");
  if (!durability) return;

  const enchantable = held.item.getComponent("minecraft:enchantable");
  const unbreaking = enchantable?.getEnchantment("unbreaking")?.level ?? 0;
  const damageChance = 1 / (unbreaking + 1);

  for (let i = 0; i < amount; i++) {
    if (Math.random() >= damageChance) continue;

    durability.damage++;

    if (durability.damage >= durability.maxDurability) {
      held.slot.setItem(undefined);
      player.playSound("random.break");
      return;
    }
  }

  held.slot.setItem(held.item);
}

function playToolSound(player, block, sound, pitch = 1, volume = 1) {
  player.playSound(sound, {
    location: block.center(),
    pitch,
    volume,
  });
}

function canCreatePath(block) {
  const above = block.above();
  return above?.isAir === true;
}

function handleToolInteraction(block, item, player) {
  if (!isModTool(item)) return false;

  const toolType = getToolType(item);

  // Axe: strip wood
  if (toolType === "axe") {
    const stripped = strippedWood.get(block.typeId);
    if (!stripped) return false;

    system.run(() => {
      block.setType(stripped);
      damageHeldTool(player, item.typeId, 1);
      playToolSound(
        player,
        block,
        block.typeId.includes("stem") || block.typeId.includes("hyphae")
          ? "use.stem"
          : "use.wood",
        0.9,
      );
    });

    return true;
  }

  // Hoe: till soil
  if (toolType === "hoe" && tillableBlocks.has(block.typeId)) {
    system.run(() => {
      block.setType("minecraft:farmland");
      damageHeldTool(player, item.typeId, 1);
      playToolSound(player, block, "use.gravel", 0.8);
    });

    return true;
  }

  // Shovel: extinguish campfires
  if (toolType === "shovel") {
    if (
      block.typeId === "minecraft:campfire" ||
      block.typeId === "minecraft:soul_campfire"
    ) {
      if (block.permutation.getState("extinguished") === true) return false;

      system.run(() => {
        block.setPermutation(
          block.permutation.withState("extinguished", true),
        );
        damageHeldTool(player, item.typeId, 1);
        playToolSound(player, block, "random.fizz", 2, 0.5);
      });

      return true;
    }

    // Shovel: create dirt paths
    if (pathBlocks.has(block.typeId) && canCreatePath(block)) {
      system.run(() => {
        block.setType("minecraft:grass_path");
        damageHeldTool(player, item.typeId, 1);
        playToolSound(player, block, "use.gravel", 0.8);
      });

      return true;
    }
  }

  return false;
}

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  if (!event.isFirstEvent) return;

  const { block, itemStack, player } = event;

  if (!isModTool(itemStack)) return;

  const handled = handleToolInteraction(block, itemStack, player);

  if (handled) {
    event.cancel = true;
  }
});

// Sword: breaking a block always costs 2 durability.
// Tools: 1 durability for effective blocks, 2 for ineffective blocks.
world.afterEvents.playerBreakBlock.subscribe((event) => {
  const { player, brokenBlockPermutation, itemStackBeforeBreak } = event;
  const item = itemStackBeforeBreak;

  if (!isModTool(item)) return;

  const toolType = getToolType(item);

  if (toolType === "sword") {
    damageHeldTool(player, item.typeId, 2);
    return;
  }

  if (!toolTypes.has(toolType)) return;

  const isEffective = effectiveBlockTags
    .get(toolType)
    ?.some((tag) => brokenBlockPermutation.hasTag(tag)) === true;

  damageHeldTool(player, item.typeId, isEffective ? 1 : 2);
});

// Sword: attacking costs 1 durability.
world.afterEvents.entityHitEntity.subscribe((event) => {
  const attacker = event.damagingEntity;
  if (attacker.typeId !== "minecraft:player") return;

  system.run(() => {
    const held = getMainhand(attacker);
    if (!held || getToolType(held.item) !== "sword") return;

    damageHeldTool(attacker, held.item.typeId, 1);
  });
});
