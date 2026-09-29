"use client";

import { Plus, Trash2 } from "lucide-react";
import { TextField } from "@/components/ui/Field";
import { CustomizationFields } from "@/components/orders/CustomizationFields";
import type { CustomField } from "@/lib/types";

export interface EditableLineItem {
  category_text: string;
  product_text: string;
  quantity: string;
  size: string;
  colour: string;
  customization_data: CustomField[];
}

export function emptyLineItem(): EditableLineItem {
  return {
    category_text: "",
    product_text: "",
    quantity: "1",
    size: "",
    colour: "",
    customization_data: [],
  };
}

/**
 * Lets one order hold several products for the same customer — e.g. a
 * keychain AND a photo frame in a single order. Each product gets its own
 * card with category, product, quantity, size, colour, and customization.
 */
export function LineItemsEditor({
  items,
  onChange,
  errors,
}: {
  items: EditableLineItem[];
  onChange: (items: EditableLineItem[]) => void;
  errors?: Record<number, { categoryText?: string; productText?: string }>;
}) {
  function updateItem(index: number, patch: Partial<EditableLineItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    onChange([...items, emptyLineItem()]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-border-strong bg-paper/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Product {index + 1}
            </p>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                aria-label={`Remove product ${index + 1}`}
                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-status-pending/10 hover:text-status-pending-text"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <TextField
              label="Category"
              required
              value={item.category_text}
              onChange={(e) => updateItem(index, { category_text: e.target.value })}
              error={errors?.[index]?.categoryText}
              placeholder="Type the category, e.g. Photo Frames"
            />
            <TextField
              label="Product"
              required
              value={item.product_text}
              onChange={(e) => updateItem(index, { product_text: e.target.value })}
              error={errors?.[index]?.productText}
              placeholder="Type the product, e.g. Wooden Name Board"
            />
            <div className="grid grid-cols-3 gap-3">
              <TextField
                label="Quantity"
                required
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateItem(index, { quantity: e.target.value })}
              />
              <TextField
                label="Size"
                value={item.size}
                onChange={(e) => updateItem(index, { size: e.target.value })}
                placeholder="e.g. 12 inch"
              />
              <TextField
                label="Colour"
                value={item.colour}
                onChange={(e) => updateItem(index, { colour: e.target.value })}
                placeholder="e.g. Natural Wood"
              />
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Customization</p>
              <CustomizationFields
                fields={item.customization_data}
                onChange={(fields) => updateItem(index, { customization_data: fields })}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong px-3.5 py-3 text-sm font-semibold text-brand-dark transition-colors hover:border-brand-dark hover:bg-brand/10"
      >
        <Plus className="h-4 w-4" />
        Add another product
      </button>
    </div>
  );
}
