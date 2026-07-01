"use client";

import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface KanbanColumnDef {
  id: string;
  label: string;
  accent?: string;
}

export interface KanbanItem {
  id: string;
}

type Grouped<T> = Record<string, T[]>;

function group<T extends KanbanItem>(
  items: T[],
  columns: KanbanColumnDef[],
  columnOf: (item: T) => string,
): Grouped<T> {
  const map: Grouped<T> = {};
  for (const c of columns) map[c.id] = [];
  for (const it of items) {
    const col = columnOf(it);
    if (!map[col]) map[col] = [];
    map[col].push(it);
  }
  return map;
}

interface KanbanProps<T extends KanbanItem> {
  columns: KanbanColumnDef[];
  items: T[];
  columnOf: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  /** Se llama al soltar: id de la card, columna destino e índice final dentro de la columna. */
  onMove: (itemId: string, toColumn: string, toIndex: number) => void;
  onCardClick?: (item: T) => void;
  /** Contenido al pie de cada columna (p.ej. quick-add). */
  columnFooter?: (columnId: string) => ReactNode;
}

export function Kanban<T extends KanbanItem>({
  columns,
  items,
  columnOf,
  renderCard,
  onMove,
  onCardClick,
  columnFooter,
}: KanbanProps<T>) {
  const [cols, setCols] = useState<Grouped<T>>(() => group(items, columns, columnOf));
  const [activeId, setActiveId] = useState<string | null>(null);

  // Resync cuando cambian los items (revalidación del server o filtro), salvo en pleno drag.
  // Patrón de ajuste de estado en render: sin efecto, sin renders en cascada.
  const [syncedItems, setSyncedItems] = useState(items);
  if (items !== syncedItems && !activeId) {
    setSyncedItems(items);
    setCols(group(items, columns, columnOf));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const byId = new Map(items.map((it) => [it.id, it]));
  const activeItem = activeId ? byId.get(activeId) : undefined;

  function findColumn(id: string): string | undefined {
    if (cols[id]) return id; // soltó sobre la columna vacía
    return columns.find((c) => cols[c.id]?.some((it) => it.id === id))?.id;
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const from = findColumn(String(active.id));
    const to = findColumn(String(over.id));
    if (!from || !to || from === to) return;

    setCols((prev) => {
      const fromItems = prev[from];
      const toItems = prev[to];
      const moving = fromItems.find((it) => it.id === active.id);
      if (!moving) return prev;
      const overIdx = toItems.findIndex((it) => it.id === over.id);
      const insertAt = overIdx >= 0 ? overIdx : toItems.length;
      return {
        ...prev,
        [from]: fromItems.filter((it) => it.id !== active.id),
        [to]: [...toItems.slice(0, insertAt), moving, ...toItems.slice(insertAt)],
      };
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const col = findColumn(String(over.id));
    if (!col) return;

    // `cols` ya refleja los movimientos de handleDragOver (re-render por evento),
    // así que el índice se calcula síncrono antes de persistir.
    const colItems = cols[col];
    const oldIndex = colItems.findIndex((it) => it.id === active.id);
    const overIndex = colItems.findIndex((it) => it.id === over.id);
    const newIndex = overIndex >= 0 ? overIndex : colItems.length - 1;
    const reordered =
      oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex
        ? arrayMove(colItems, oldIndex, newIndex)
        : colItems;
    const toIndex = Math.max(0, reordered.findIndex((it) => it.id === active.id));

    setCols((prev) => ({ ...prev, [col]: reordered }));
    onMove(String(active.id), col, toIndex);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => (
          <Column
            key={col.id}
            def={col}
            items={cols[col.id] ?? []}
            renderCard={renderCard}
            onCardClick={onCardClick}
            footer={columnFooter?.(col.id)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="rotate-1 opacity-90">{renderCard(activeItem)}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column<T extends KanbanItem>({
  def,
  items,
  renderCard,
  onCardClick,
  footer,
}: {
  def: KanbanColumnDef;
  items: T[];
  renderCard: (item: T) => ReactNode;
  onCardClick?: (item: T) => void;
  footer?: ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: def.id });
  return (
    <div className="flex min-h-[180px] flex-col rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 px-4 pb-2 pt-3.5">
        {def.accent ? (
          <span className="size-2.5 rounded-full" style={{ background: def.accent }} />
        ) : null}
        <span className="text-sm font-semibold text-navy">{def.label}</span>
        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium text-ink">
          {items.length}
        </span>
      </div>
      <SortableContext
        id={def.id}
        items={items.map((it) => it.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="flex flex-1 flex-col gap-2.5 px-3 pb-3">
          {items.map((it) => (
            <SortableCard key={it.id} id={it.id} onClick={onCardClick ? () => onCardClick(it) : undefined}>
              {renderCard(it)}
            </SortableCard>
          ))}
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-faint">
              Vacío
            </div>
          ) : null}
        </div>
      </SortableContext>
      {footer ? <div className="px-3 pb-3">{footer}</div> : null}
    </div>
  );
}

function SortableCard({
  id,
  onClick,
  children,
}: {
  id: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-40" : ""}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
