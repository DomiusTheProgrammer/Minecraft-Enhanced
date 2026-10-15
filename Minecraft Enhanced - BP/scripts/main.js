import { world } from "@minecraft/server";

const toolTypes = new Set(["axe", "hoe", "pickaxe", "shovel"]);
const effectiveBlockTags = new Map([
  [
    "axe",
    ["wood", "minecraft:is_tool_item_destructible", "minecraft:is_axe_item_destructible"],
  ],
  [
    "hoe",
    ["plant", "crop", "leaves", "minecraft:is_hoe_item_destructible"],
  ],
  [
    "pickaxe",
    [
      "stone",
      "iron_pick_diggable",
      "minecraft:diamond_tier_destructible",
      "minecraft:iron_tier_destructible",
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

function damageMainhand(entity, amount, expectedTypeId) {
  const equippable = entity.getComponent("minecraft:equippable");
  const mainhand = equippable?.getEquipmentSlot("Mainhand");
  const item = mainhand?.getItem();
  if (!item || item.typeId !== expectedTypeId) {
    return;
  }

  const durability = item.getComponent("minecraft:durability");
  if (!durability || durability.unbreakable) {
    return;
  }

  const enchantable = item.getComponent("minecraft:enchantable");
  const unbreakingLevel = enchantable?.getEnchantment("unbreaking")?.level ?? 0;
  for (let point = 0; point < amount; point++) {
    if (Math.random() < 1 / (unbreakingLevel + 1)) {
      durability.damage += 1;
    }
  }

  mainhand.setItem(
    durability.damage >= durability.maxDurability ? undefined : item,
  );
}

world.afterEvents.entityHitEntity.subscribe(({ damagingEntity }) => {
  const equippable = damagingEntity.getComponent("minecraft:equippable");
  const item = equippable?.getEquipmentSlot("Mainhand").getItem();
  if (!item?.typeId.startsWith("me:")) {
    return;
  }

  const itemType = item.typeId.slice(3).split("_").pop();
  if (itemType === "sword") {
    damageMainhand(damagingEntity, 1, item.typeId);
  } else if (toolTypes.has(itemType)) {
    damageMainhand(damagingEntity, 2, item.typeId);
  }
});

world.afterEvents.playerBreakBlock.subscribe(
  ({ player, brokenBlockPermutation, itemStackBeforeBreak }) => {
    const item = itemStackBeforeBreak;
    if (!item?.typeId.startsWith("me:")) {
      return;
    }

    const itemType = item.typeId.slice(3).split("_").pop();
    if (itemType === "sword") {
      damageMainhand(player, 2, item.typeId);
      return;
    }
    if (!toolTypes.has(itemType)) {
      return;
    }

    const isEffectiveBlock =
      effectiveBlockTags
        .get(itemType)
        ?.some((tag) => brokenBlockPermutation.hasTag(tag)) === true;
    damageMainhand(player, isEffectiveBlock ? 1 : 2, item.typeId);
  },
);
