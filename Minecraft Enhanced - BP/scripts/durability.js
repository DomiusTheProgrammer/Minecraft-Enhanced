/*Copyright by CC BY-NC-SA 4.0
Durability handling for mod tools (namespace "me:"), mirroring vanilla behavior:
- mining: 1 damage (sword 2), none for instant-break blocks
- attacking: sword 1, other tools 2
- Unbreaking, creative mode, unbreakable items, break sound and item removal*/
import { world, system, GameMode, EquipmentSlot } from "@minecraft/server";

const NAMESPACE = "me:";
const TOOL_TYPES = ["sword", "pickaxe", "axe", "shovel", "hoe"];

function getToolType(item) {
  if (!item || !item.typeId.startsWith(NAMESPACE)) return undefined;
  return TOOL_TYPES.find((t) => item.typeId.endsWith("_" + t));
}

// Blocks with zero hardness: breaking them costs no durability.
const INSTANT_BREAK_EXACT = new Set([
  "short_grass", "tallgrass", "fern", "large_fern", "tall_grass", "double_plant",
  "deadbush", "dead_bush", "seagrass", "kelp", "vine", "glow_lichen", "hanging_roots",
  "torch", "soul_torch", "redstone_torch", "copper_torch", "redstone_wire", "tripwire",
  "tripwire_hook", "lever", "wheat", "carrots", "potatoes", "beetroot", "melon_stem",
  "pumpkin_stem", "nether_wart", "sugar_cane", "reeds", "bamboo_sapling", "sweet_berry_bush",
  "brown_mushroom", "red_mushroom", "crimson_fungus", "warped_fungus", "crimson_roots",
  "warped_roots", "nether_sprouts", "weeping_vines", "twisting_vines", "fire", "soul_fire",
  "sapling", "flower_pot", "cave_vines", "small_dripleaf_block", "spore_blossom",
  "pink_petals", "wildflowers", "leaf_litter", "firefly_bush", "bush", "cactus_flower",
  "torchflower", "torchflower_crop", "pitcher_crop", "frog_spawn", "structure_void",
  "light_block", "slime", "tnt", "scaffolding", "cocoa", "coral_fan", "coral_fan_dead",
]);

function isInstantBreak(typeId) {
  const id = typeId.replace("minecraft:", "");
  return (
    INSTANT_BREAK_EXACT.has(id) ||
    id.endsWith("_sapling") ||
    id.endsWith("_tulip") ||
    id.endsWith("_coral_fan") ||
    id.endsWith("_fungus") ||
    id.endsWith("_roots") ||
    ["dandelion", "poppy", "blue_orchid", "allium", "azure_bluet", "oxeye_daisy",
      "cornflower", "lily_of_the_valley", "wither_rose", "sunflower", "lilac",
      "rose_bush", "peony", "red_flower", "yellow_flower", "torchflower"].includes(id)
  );
}

function isCreative(player) {
  return player.getGameMode() === GameMode.Creative;
}

// Applies Unbreaking: each point of damage is skipped with chance level/(level+1).
function rollUnbreaking(item, amount) {
  const level =
    item.getComponent("minecraft:enchantable")?.getEnchantment("unbreaking")
      ?.level ?? 0;
  if (level <= 0) return amount;
  let dealt = 0;
  for (let i = 0; i < amount; i++) {
    if (Math.random() < 1 / (level + 1)) dealt++;
  }
  return dealt;
}

function damageMainHand(player, expectedTypeId, amount) {
  if (isCreative(player)) return;
  const equippable = player.getComponent("minecraft:equippable");
  const item = equippable?.getEquipment(EquipmentSlot.Mainhand);
  if (!item || item.typeId !== expectedTypeId) return;

  const durability = item.getComponent("minecraft:durability");
  if (!durability) return;

  const dealt = rollUnbreaking(item, amount);
  if (dealt <= 0) return;

  if (durability.damage + dealt >= durability.maxDurability) {
    equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
    player.playSound("random.break");
    return;
  }
  durability.damage += dealt;
  equippable.setEquipment(EquipmentSlot.Mainhand, item);
}

// Mining
world.afterEvents.playerBreakBlock.subscribe((ev) => {
  const { player, itemStackBeforeBreak: item, brokenBlockPermutation } = ev;
  const type = getToolType(item);
  if (!type) return;
  if (isInstantBreak(brokenBlockPermutation.type.id)) return;
  damageMainHand(player, item.typeId, type === "sword" ? 2 : 1);
});

// Attacking: the engine applies the durability damage on hit, so we only set the amount.
// Entity hit: swords lose 1, other tools lose 2 (vanilla). Attached to every tool via "me:durability".
system.beforeEvents.startup.subscribe(({ itemComponentRegistry }) => {
  itemComponentRegistry.registerCustomComponent("me:durability", {
    onBeforeDurabilityDamage(event) {
      event.durabilityDamage = getToolType(event.itemStack) === "sword" ? 1 : 2;
    },
  });
});
