"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reshuffleDay } from "@/app/actions";
import { toast } from "sonner";
import { ShuffleIcon, Loader2Icon } from "lucide-react";

type ReshuffleDayDialogProps = {
  dayId: string;
  dayLabel: string;
};

export function ReshuffleDayDialog({ dayId, dayLabel }: ReshuffleDayDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await reshuffleDay(dayId, prompt.trim() || undefined);
      if (result.ok) {
        toast.success("Day plan updated");
        setOpen(false);
        setPrompt("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Reshuffle ${dayLabel}`}>
          <ShuffleIcon className="size-3.5" />
          Reshuffle day
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reshuffle day</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Generate a new plan for this day. Suggestions will avoid places you already have on other days.
        </p>
        <div className="space-y-2">
          <Label htmlFor="reshuffle-prompt">Focus (optional)</Label>
          <Input
            id="reshuffle-prompt"
            type="text"
            placeholder="e.g. more food, skip museums"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={isPending}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" />
                Reshuffling…
              </>
            ) : (
              <>
                <ShuffleIcon className="size-3.5" />
                Reshuffle day
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
