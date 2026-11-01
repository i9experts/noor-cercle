import { useState } from "react";
import TrainingsBoard from "@/components/trainings/TrainingsBoard";
import MurabbiCourse from "./MurabbiCourse";

/** The murabbi's trainings: the ones they have, and the marketplace of new ones. */
export default function MurabbiTrainings() {
  const [open, setOpen] = useState<string | null>(null);

  if (open) {
    return <MurabbiCourse key={open} courseKey={open} onBack={() => { setOpen(null); window.scrollTo(0, 0); }} />;
  }
  return (
    <div className="page-animate">
      <div className="mb-5">
        <h2 className="font-serif text-[26px] text-nc-dark">Trainings</h2>
        <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
          Your trainings and what’s next. A new training opens once you’ve finished the ones before it (every lesson, assignment
          and reflection); ask to join and the team will open it for you.
        </p>
      </div>
      <TrainingsBoard lang="en" onOpen={(t) => { setOpen(t.key); window.scrollTo(0, 0); }} />
    </div>
  );
}
