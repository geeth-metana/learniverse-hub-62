import { useState } from "react";
import { Settings } from "@/components/icons";
import { PrimeSettingsDialog } from "./PrimeSettingsDialog";

export function PrimeSettingsMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Prime settings"
        onClick={() => setOpen(true)}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <Settings className="h-5 w-5" />
      </button>

      <PrimeSettingsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
