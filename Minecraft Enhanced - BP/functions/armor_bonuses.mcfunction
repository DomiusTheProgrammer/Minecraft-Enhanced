# Bronze is useful for mining under water (Haste II, as long as the head is in water)
execute as @a[hasitem=[{item=me:bronze_helmet,location=slot.armor.head},{item=me:bronze_chestplate,location=slot.armor.chest},{item=me:bronze_leggings,location=slot.armor.legs},{item=me:bronze_boots,location=slot.armor.feet}]] at @s if block ~ ~1 ~ water run effect @s haste 2 1 true
execute as @a[hasitem=[{item=me:bronze_helmet,location=slot.armor.head},{item=me:bronze_chestplate,location=slot.armor.chest},{item=me:bronze_leggings,location=slot.armor.legs},{item=me:bronze_boots,location=slot.armor.feet}]] at @s if block ~ ~1 ~ flowing_water run effect @s haste 2 1 true

# Full emerald set: better trading (Hero of the Village = ~30% discount at villagers)
execute as @a[hasitem=[{item=me:emerald_helmet,location=slot.armor.head},{item=me:emerald_chestplate,location=slot.armor.chest},{item=me:emerald_leggings,location=slot.armor.legs},{item=me:emerald_boots,location=slot.armor.feet}]] run effect @s village_hero 2 0 true

# Full steel set: additional protection (Resistance I = 20% less damage)
execute as @a[hasitem=[{item=me:steel_helmet,location=slot.armor.head},{item=me:steel_chestplate,location=slot.armor.chest},{item=me:steel_leggings,location=slot.armor.legs},{item=me:steel_boots,location=slot.armor.feet}]] run effect @s resistance 2 0 true
