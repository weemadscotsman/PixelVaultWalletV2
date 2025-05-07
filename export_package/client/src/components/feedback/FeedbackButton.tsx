import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackDialog } from "./FeedbackDialog";

/**
 * A floating button that opens the feedback dialog.
 * This component is typically placed at the bottom-right corner of the page.
 */
export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full w-12 h-12 p-0 bg-black hover:bg-blue-900 shadow-lg border border-blue-400 backdrop-blur-sm bg-opacity-78 text-shadow-neon"
        aria-label="Submit Feedback"
      >
        <CircleHelp className="h-6 w-6 animate-pulse text-blue-100" />
      </Button>
      
      <FeedbackDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}