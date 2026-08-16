import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";

export function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy");
    }
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url, text: `Add your availability for ${title}` });
        return;
      } catch {
        /* cancelled */
      }
    }
    await copy();
  }

  return (
    <div className="flex gap-2">
      <Button type="button" variant="secondary" className="flex-1" onClick={() => void share()}>
        <Share2 />
        Share
      </Button>
      <Button type="button" variant="outline" className="flex-1" onClick={() => void copy()}>
        {copied ? <Check /> : <Copy />}
        {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  );
}
