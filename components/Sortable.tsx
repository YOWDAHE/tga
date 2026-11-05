"use client";

import type { CSSProperties, ReactNode } from "react";
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	rectSortingStrategy,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ActionIcon } from "@mantine/core";
import { IconGripVertical } from "@tabler/icons-react";

export { arrayMove };

type Id = string | number;

/**
 * Drag-and-drop ordering for a list or grid. Reports the new order as (from, to) indexes;
 * pair it with arrayMove. Items are made draggable with useSortableItem.
 */
export function SortableList({
	ids,
	onMove,
	layout = "list",
	children,
}: {
	ids: Id[];
	onMove: (from: number, to: number) => void;
	/** "grid" for items that wrap into rows */
	layout?: "list" | "grid";
	children: ReactNode;
}) {
	const sensors = useSensors(
		// A short travel before a drag starts, so clicks on buttons inside an item still work
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const onDragEnd = ({ active, over }: DragEndEvent) => {
		if (!over || active.id === over.id) return;
		const from = ids.indexOf(active.id);
		const to = ids.indexOf(over.id);
		if (from !== -1 && to !== -1) onMove(from, to);
	};

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
			<SortableContext items={ids} strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}>
				{children}
			</SortableContext>
		</DndContext>
	);
}

/** Wires one item: spread `itemProps` on its root, and either `dragProps` on the root too or a <DragHandle handle={handle}/> inside. */
export function useSortableItem(id: Id) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging, setActivatorNodeRef } = useSortable({ id });
	const style: CSSProperties = {
		transform: CSS.Translate.toString(transform),
		transition,
		position: "relative",
		zIndex: isDragging ? 10 : undefined,
		opacity: isDragging ? 0.85 : undefined,
		boxShadow: isDragging ? "0 12px 32px rgba(15, 23, 42, 0.18)" : undefined,
	};
	return {
		isDragging,
		itemProps: { ref: setNodeRef, style },
		/** Makes the whole item the drag handle */
		dragProps: { ...attributes, ...listeners, style: { cursor: isDragging ? "grabbing" : "grab", touchAction: "none" } as CSSProperties },
		handle: { ref: setActivatorNodeRef, attributes, listeners },
	};
}

/** A grip button that drags its item. */
export function DragHandle({ handle, label }: { handle: ReturnType<typeof useSortableItem>["handle"]; label: string }) {
	return (
		<ActionIcon
			ref={handle.ref}
			variant="subtle"
			color="gray"
			aria-label={label}
			style={{ cursor: "grab", touchAction: "none" }}
			{...handle.attributes}
			{...handle.listeners}
		>
			<IconGripVertical size={16} />
		</ActionIcon>
	);
}
