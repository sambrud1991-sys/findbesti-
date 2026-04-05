import { useState } from "react";
import { ChevronRight, Video, MessageCircle, Gift, Globe } from "lucide-react";
import onboarding1 from "@/assets/onboarding1.png";
import onboarding2 from "@/assets/onboarding2.png";
import onboarding3 from "@/assets/onboarding3.png";
import onboarding4 from "@/assets/onboarding4.png";

const slides = [
  {
    image: onboarding1,
    icon: Video,
    title: "Live Video Calls",
    description: "Connect face-to-face with people around the world through HD video calls",
    color: "from-primary to-accent",
  },
  {
    image: onboarding2,
    icon: MessageCircle,
    title: "Chat & Connect",
    description: "Send messages, share moments and build meaningful friendships",
    color: "from-accent to-primary",
  },
  {
    image: onboarding3,
    icon: Gift,
    title: "Earn & Gift Coins",
    description: "Complete tasks to earn coins, send gifts and withdraw real money",
    color: "from-primary to-online",
  },
  {
    image: onboarding4,
    icon: Globe,
    title: "Global Community",
    description: "Join millions of users from different countries and cultures",
    color: "from-online to-primary",
  },
];

interface OnboardingPageProps {
  onComplete: () => void;
}

const OnboardingPage = ({ onComplete }: OnboardingPageProps) => {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];
  const isLast = current === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem("findbesti_onboarding_done", "true");
      onComplete();
    } else {
      setCurrent((p) => p + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("findbesti_onboarding_done", "true");
    onComplete();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between py-8 px-6 overflow-hidden">
      {/* Skip */}
      <div className="w-full flex justify-end">
        {!isLast && (
          <button onClick={handleSkip} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Skip
          </button>
        )}
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center w-full animate-fade-in" key={current}>
        <img
          src={slide.image}
          alt={slide.title}
          className="w-64 h-64 object-contain drop-shadow-xl"
          width={512}
          height={512}
        />
      </div>

      {/* Content */}
      <div className="w-full max-w-sm text-center space-y-4 animate-fade-in" key={`text-${current}`}>
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${slide.color} flex items-center justify-center mx-auto shadow-lg`}>
          <slide.icon size={26} className="text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground">{slide.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{slide.description}</p>
      </div>

      {/* Dots & Button */}
      <div className="w-full max-w-sm space-y-6 mt-8">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Next / Get Started */}
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
        >
          {isLast ? "Get Started" : "Next"}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;
