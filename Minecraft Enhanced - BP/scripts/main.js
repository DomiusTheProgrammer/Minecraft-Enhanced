import { system, world } from "@minecraft/server";

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

const lastDurability = new Map();
const pendingDurability = new Map();

function getItemType(item) {
  return item.typeId.slice(3).split("_").pop();
}

function getDurabilityLoss(amount, unbreakingLevel) {
  let loss = 0;
  for (let point = 0; point < amount; point++) {
    if (Math.random() < 1 / (unbreakingLevel + 1)) {
      loss++;
    }
  }
  return loss;
}

function getMainhand(entity) {
  const equippable = entity.getComponent("minecraft:equippable");
  const mainhand = equippable?.getEquipmentSlot("Mainhand");
  const item = mainhand?.getItem();
  return mainhand && item ? { mainhand, item } : undefined;
}

function restoreSwordDurability(entity) {
  const held = getMainhand(entity);
  if (!held || getItemType(held.item) !== "sword") {
    return;
  }

  const durability = held.item.getComponent("minecraft:durability");
  if (!durability || durability.damage === 0) {
    return;
  }

  durability.damage -= 1;
  held.mainhand.setItem(held.item);
}

world.afterEvents.entityHitEntity.subscribe(({ damagingEntity }) => {
  system.run(() => restoreSwordDurability(damagingEntity));
});

function captureMainhandDurability() {
  for (const player of world.getAllPlayers()) {
    const held = getMainhand(player);
    const durability = held?.item.getComponent("minecraft:durability");
    if (!held || !durability || !held.item.typeId.startsWith("me:")) {
      continue;
    }

    const key = `${player.id}:${held.item.typeId}`;
    if (!pendingDurability.has(key)) {
      lastDurability.set(key, durability.damage);
    }
  }
}

function applyBlockDurability(entity, amount, expectedTypeId) {
  const held = getMainhand(entity);
  if (!held || held.item.typeId !== expectedTypeId) {
    return;
  }

  const durability = held.item.getComponent("minecraft:durability");
  if (!durability) {
    return;
  }

  const key = `${entity.id}:${expectedTypeId}`;
  const pending = pendingDurability.get(key);
  const previous = pending?.damage ?? lastDurability.get(key) ?? durability.damage;
  const enchantable = held.item.getComponent("minecraft:enchantable");
  const unbreakingLevel = enchantable?.getEnchantment("unbreaking")?.level ?? 0;
  const scriptedLoss = getDurabilityLoss(amount, unbreakingLevel);
  const targetDamage = previous + scriptedLoss;
  const selectedSlotIndex =
    entity.typeId === "minecraft:player" ? entity.selectedSlotIndex : undefined;
  const update = { damage: targetDamage };
  pendingDurability.set(key, update);
  system.run(() => {
    if (pendingDurability.get(key) !== update) {
      return;
    }

    const current = getMainhand(entity);
    const stillSelectedSlot =
      selectedSlotIndex === undefined || entity.selectedSlotIndex === selectedSlotIndex;
    let applied = false;
    if (stillSelectedSlot && current?.item.typeId === expectedTypeId) {
      const currentDurability = current.item.getComponent("minecraft:durability");
      if (currentDurability) {
        currentDurability.damage = targetDamage;
        current.mainhand.setItem(
          targetDamage >= currentDurability.maxDurability
            ? undefined
            : current.item,
        );
        applied = true;
      }
    } else if (stillSelectedSlot && !current && selectedSlotIndex !== undefined) {
      const originalDurability = held.item.getComponent("minecraft:durability");
      if (originalDurability) {
        originalDurability.damage = targetDamage;
        held.mainhand.setItem(
          targetDamage >= originalDurability.maxDurability
            ? undefined
            : held.item,
        );
        applied = true;
      }
    }

    if (applied) {
      lastDurability.set(key, targetDamage);
    }
    pendingDurability.delete(key);
  });
}

system.runInterval(captureMainhandDurability, 1);

world.afterEvents.playerBreakBlock.subscribe(
  ({ player, brokenBlockPermutation, itemStackBeforeBreak }) => {
    const item = itemStackBeforeBreak;
    if (!item?.typeId.startsWith("me:")) {
      return;
    }

    const itemType = getItemType(item);
    if (itemType === "sword") {
      applyBlockDurability(player, 2, item.typeId);
      return;
    }
    if (!toolTypes.has(itemType)) {
      return;
    }

    const isEffectiveBlock =
      effectiveBlockTags
        .get(itemType)
        ?.some((tag) => brokenBlockPermutation.hasTag(tag)) === true;
    applyBlockDurability(player, isEffectiveBlock ? 1 : 2, item.typeId);
  },
);
