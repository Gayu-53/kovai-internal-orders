"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { saveDispatchDetails } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField } from "@/components/ui/Field";
import type { DispatchDetails } from "@/lib/types";

export function DispatchForm({
  orderId,
  dispatch,
  onSaved,
}: {
  orderId: string;
  dispatch: DispatchDetails | null | undefined;
  onSaved: (dispatch: DispatchDetails) => void;
}) {
  const [dispatchDate, setDispatchDate] = useState(dispatch?.dispatch_date?.slice(0, 10) ?? "");
  const [courier, setCourier] = useState(dispatch?.courier_name ?? "");
  const [tracking, setTracking] = useState(dispatch?.tracking_number ?? "");
  const [notes, setNotes] = useState(dispatch?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const { dispatch: saved } = await saveDispatchDetails(orderId, {
        dispatch_date: dispatchDate ? new Date(dispatchDate).toISOString() : null,
        courier_name: courier || null,
        tracking_number: tracking || null,
        notes: notes || null,
      });
      onSaved(saved);
      toast.success("Dispatch details saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save dispatch details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <TextField
        label="Dispatch Date"
        type="date"
        value={dispatchDate}
        onChange={(e) => setDispatchDate(e.target.value)}
      />
      <TextField
        label="Courier / Delivery Method"
        value={courier}
        onChange={(e) => setCourier(e.target.value)}
        placeholder="Optional"
      />
      <TextField
        label="Tracking Number"
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
        placeholder="Optional"
      />
      <TextAreaField
        label="Dispatch Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional"
      />
      <Button onClick={handleSave} disabled={saving} loading={saving} className="w-full">
        Save Dispatch Details
      </Button>
    </div>
  );
}
