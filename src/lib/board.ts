import type { PickItem } from "../../db/schema";

export const BOARD_SIZE = 9;

export function positionedItems(items: PickItem[]) {
  return items.map((item, index) => ({ ...item, slot: item.slot ?? index }))
    .sort((a, b) => a.slot - b.slot);
}

export function boardSlots(items: PickItem[]): (PickItem | undefined)[] {
  const slots: (PickItem | undefined)[] = Array.from({ length: BOARD_SIZE });
  for (const item of positionedItems(items)) slots[item.slot] = item;
  return slots;
}

export function placeItem(items: PickItem[], item: PickItem, from: number, to: number) {
  const positioned = positionedItems(items);
  const target = positioned.find((pick) => pick.slot === to);
  return [
    ...positioned.filter((pick) => pick.slot !== from && pick.slot !== to),
    ...(target && from !== to ? [{ ...target, slot: from }] : []),
    { ...item, slot: to },
  ].sort((a, b) => a.slot - b.slot);
}
