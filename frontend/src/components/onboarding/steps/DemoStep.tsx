import { Button } from "@/components/ui/Button";

type Props = {
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => Promise<void>;
  isFinishing: boolean;
};

const slides = [
  {
    title: "Why it's faster",
    text: "Create structured event briefings in minutes instead of juggling emails, notes and documents.",
    image: "/assets/photo.jpg"
  },
  {
    title: "Create a briefing",
    text: "Choose your event, activate modules, fill operational information and share with your team.",
    video: "/assets/video-promo.mp4"
  },
  {
    title: "Let's go",
    text: "Your workspace is ready. You can now create your first briefing.",
    image: "/assets/photo2.jpg"
  }
];

export function DemoStep({ index, onPrev, onNext, onFinish, isFinishing }: Props) {
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">{slide.title}</h2>
        <p className="mt-1 text-sm text-[#70758d]">{slide.text}</p>
      </div>

      {slide.image ? (
        <img src={slide.image} alt={slide.title} className="h-64 w-full rounded-2xl object-cover md:h-80" />
      ) : null}

      {slide.video ? (
        <video className="w-full rounded-2xl border border-[#e7eaf5]" controls muted playsInline preload="metadata">
          <source src={slide.video} type="video/mp4" />
        </video>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" onClick={onPrev} disabled={index === 0}>
          Back
        </Button>
        {!isLast ? (
          <Button type="button" withArrow onClick={onNext}>
            Next
          </Button>
        ) : (
          <Button type="button" withArrow disabled={isFinishing} onClick={() => void onFinish()}>
            {isFinishing ? "Opening..." : "Create my first briefing"}
          </Button>
        )}
      </div>
    </div>
  );
}
