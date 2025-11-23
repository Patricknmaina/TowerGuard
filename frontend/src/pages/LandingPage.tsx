import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full overflow-hidden bg-warm-50">
      {/* Split Hero Layout */}
      <div className="flex h-screen">
        {/* Soft vertical divider */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/40 backdrop-blur-sm z-10" />

        {/* Left: Mau Forest Now (Degraded) */}
        <div className="relative flex-1 h-full overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage: "url('/mau deforested.jpg')",
            }}
          >
            {/* Fallback gradient if image doesn't load */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-800/25 via-amber-700/15 to-amber-900/25" />
          </div>
          {/* Subtle overlay for legibility - lighter for white aesthetic */}
          <div className="absolute inset-0 bg-charcoal-900/5" />
          {/* Label - premium white aesthetic */}
          <div className="absolute bottom-12 left-12 z-10">
            <div className="rounded-3xl bg-white/95 backdrop-blur-sm px-6 py-3 shadow-lg border border-warm-200">
              <p className="text-sm uppercase tracking-[0.3em] text-charcoal-700 font-semibold">MAU FOREST</p>
              <p className="text-xs text-charcoal-600 mt-1">Underwhelming efforts (degraded)</p>
            </div>
          </div>
        </div>

        {/* Right: Mau Forest After Restoration (Lush) */}
        <div className="relative flex-1 h-full overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage: "url('/mau restoration.jpg')",
            }}
          >
            {/* Fallback gradient if image doesn't load */}
            <div className="absolute inset-0 bg-gradient-to-br from-soft-green-700/25 via-soft-green-600/15 to-soft-green-800/25" />
          </div>
          {/* Subtle overlay for legibility - lighter for white aesthetic */}
          <div className="absolute inset-0 bg-black/10 z-10" />
          {/* Label - premium white aesthetic */}
          <div className="absolute bottom-12 right-12 z-20">
            <div className="rounded-3xl bg-white/95 backdrop-blur-sm px-6 py-3 shadow-lg border border-warm-200">
              <p className="text-sm uppercase tracking-[0.3em] text-charcoal-700 font-semibold">MAU FOREST</p>
              <p className="text-xs text-charcoal-600 mt-1">After restoration (recovering, not complete)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Centered Text Overlay - Premium white aesthetic */}
      <div className="absolute inset-0 flex items-start justify-center z-20 pointer-events-none pt-0 md:pt-2">
        <div className="text-center px-6 max-w-3xl pointer-events-auto">
          <div className="rounded-[28px] bg-white/95 backdrop-blur-md px-8 md:px-12 py-12 md:py-14 shadow-xl border border-warm-200 space-y-5">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-charcoal-900 leading-tight">
              Kenya’s Water Towers Are Healing
            </h1>
            <p className="text-base md:text-lg text-charcoal-600 leading-relaxed max-w-2xl mx-auto">
              Satellite data shows Mau Forest, our case study, has lost ~19% tree cover since 2001. <br className="hidden md:block" />
              Restoration is underway, but large areas still need seedlings.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate("/towers")}
                className="rounded-full bg-soft-green-600 hover:bg-soft-green-700 text-white px-7 py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300"
              >
                Explore Water Towers
              </button>
              <button
                onClick={() => navigate("/story")}
                className="rounded-full bg-white border border-warm-200 text-charcoal-900 px-7 py-3 text-base font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                See the Journey
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mt-16 mb-14 px-6 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard value="19%" label="Tree Cover Lost" caption="Mau Forest Complex since 2001." />
        <StatCard value="40%+" label="Loss in Some Blocks" caption="Severe degradation since the 1980s." />
        <StatCard value="33,138 ha" label="Restoration Target" caption="Planned recovery by 2035." />
        <StatCard value="70% Survival Target" label="Realistic Success Benchmark" caption="Large-scale restoration standard in degraded towers." />
      </div>
      <p className="text-sm text-gray-600 text-center mt-6 px-6">
        Mau is one example — TowerGuard tracks restoration across Kenya’s 18 gazetted water towers and beyond.
      </p>

      {/* Scroll Cue - Premium white aesthetic */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-3">
        <button
          onClick={() => navigate("/story")}
          className="rounded-full bg-white/90 backdrop-blur-sm px-4 py-2 shadow-lg border border-warm-200 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-charcoal-600 font-medium mb-1">See the journey</p>
          <ChevronDown className="w-4 h-4 text-charcoal-500 mx-auto animate-bounce" />
        </button>
      </div>
    </div>
  );
};

interface StatCardProps {
  value: string;
  label: string;
  caption: string;
}

const StatCard = ({ value, label, caption }: StatCardProps) => (
  <div className="rounded-3xl bg-white border border-black/5 shadow-sm p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
    <div className="text-3xl font-semibold text-gray-900 mb-2">{value}</div>
    <div className="text-sm font-medium text-gray-700">{label}</div>
    <p className="text-xs text-gray-500 leading-relaxed mt-2">{caption}</p>
  </div>
);

export default LandingPage;

