import { useNavigate } from "react-router-dom";
import { Sprout, Satellite, Users } from "lucide-react";

const StoryPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Hero Banner */}
      <div className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/restoration.png')",
          }}
        >
          {/* Fallback gradient if image doesn't load */}
          <div className="absolute inset-0 bg-gradient-to-br from-soft-green-600/70 via-soft-green-500/60 to-soft-green-700/70" />
        </div>
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-charcoal-900/20" />
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center px-6 max-w-4xl">
            <div className="rounded-[32px] bg-white/95 backdrop-blur-md px-10 md:px-14 py-14 shadow-xl border border-warm-200 space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-charcoal-900 leading-tight">
                The Story of Restoration
              </h1>
              <p className="text-lg md:text-xl text-charcoal-600 leading-relaxed">
                How TowerGuard helps communities restore Kenya's water towers, one seedling at a time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Narrative Blocks */}
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 space-y-16 md:space-y-24">
        {/* Block 1: Amina wants to plant a seedling */}
        <div className="flex flex-col md:flex-row gap-10 md:gap-14 items-center">
          <div className="flex-1">
            <div className="rounded-3xl bg-white p-8 md:p-12 shadow-md border border-warm-200 transition-transform duration-500 hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="rounded-full bg-soft-green-100 p-4 shadow-inner">
                  <Sprout className="w-8 h-8 text-soft-green-600" />
                </div>
                <div className="h-px flex-1 bg-warm-200" />
                <span className="text-xs uppercase tracking-[0.3em] text-charcoal-500 font-medium">Chapter 1</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-charcoal-900 mb-4 leading-tight">
                Amina wants to plant a seedling.
              </h2>
              <p className="text-lg text-charcoal-600 leading-relaxed">
                Like thousands of Kenyans, Amina is passionate about restoring her local water tower. She knows that
                healthy forests mean clean water, but she's not sure which indigenous species will thrive in her area.
                Where should she start?
              </p>
            </div>
          </div>
          <div className="flex-1">
            <div className="rounded-3xl overflow-hidden shadow-md border border-warm-200 h-full">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: "url('/woman restoring mangroves in kenya.jpg')",
                  minHeight: "400px",
                }}
              >
                <div className="w-full h-full bg-gradient-to-t from-charcoal-900/60 to-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* Block 2: TowerGuard uses data to recommend species */}
        <div className="flex flex-col md:flex-row-reverse gap-10 md:gap-14 items-center">
          <div className="flex-1">
            <div className="rounded-3xl bg-white p-8 md:p-12 shadow-md border border-warm-200 transition-transform duration-500 hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="rounded-full bg-soft-green-100 p-4 shadow-inner">
                  <Satellite className="w-8 h-8 text-soft-green-600" />
                </div>
                <div className="h-px flex-1 bg-warm-200" />
                <span className="text-xs uppercase tracking-[0.3em] text-charcoal-500 font-medium">Chapter 2</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-charcoal-900 mb-4 leading-tight">
                TowerGuard uses NDVI + climate + soil data to recommend the right indigenous species in the right water
                tower.
              </h2>
              <p className="text-lg text-charcoal-600 leading-relaxed">
                TowerGuard analyzes satellite imagery, rainfall patterns, temperature, and soil composition for each of
                Kenya's 18 gazetted water towers. Our platform tells Amina which native trees will grow best in her
                specific location, ensuring higher survival rates and faster ecosystem recovery.
              </p>
            </div>
          </div>
          <div className="flex-1">
            <div className="rounded-3xl overflow-hidden shadow-md border border-warm-200 h-full">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: "url('/data driven.png')",
                  minHeight: "400px",
                }}
              >
                <div className="w-full h-full bg-gradient-to-t from-charcoal-900/60 to-transparent flex items-end p-6">
                  <p className="text-sm text-white font-medium">Data-driven insights for restoration</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Block 3: TowerGuard connects to nurseries */}
        <div className="flex flex-col md:flex-row gap-10 md:gap-14 items-center">
          <div className="flex-1">
            <div className="rounded-3xl bg-white p-8 md:p-12 shadow-md border border-warm-200 transition-transform duration-500 hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="rounded-full bg-soft-green-100 p-4 shadow-inner">
                  <Users className="w-8 h-8 text-soft-green-600" />
                </div>
                <div className="h-px flex-1 bg-warm-200" />
                <span className="text-xs uppercase tracking-[0.3em] text-charcoal-500 font-medium">Chapter 3</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-charcoal-900 mb-4 leading-tight">
                TowerGuard connects her to a nearby community nursery to purchase seedlings and restore together.
              </h2>
              <p className="text-lg text-charcoal-600 leading-relaxed">
                Once Amina knows what to plant, TowerGuard shows her the nearest community nurseries that stock those
                indigenous species. She can purchase seedlings, join restoration groups, and track the collective impact
                of her community's efforts. Together, they're healing Kenya's water towers.
              </p>
            </div>
          </div>
          <div className="flex-1">
            <div className="rounded-3xl overflow-hidden shadow-md border border-warm-200 h-full">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: "url('/community.png')",
                  minHeight: "400px",
                }}
              >
                <div className="w-full h-full bg-gradient-to-t from-charcoal-900/60 to-transparent flex items-end p-6">
                  <p className="text-sm text-white font-medium">Community members planting indigenous seedlings</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center pt-8">
          <div className="rounded-[32px] bg-gradient-to-br from-white to-warm-50 p-12 md:p-16 shadow-xl border border-warm-200 space-y-4">
            <h2 className="text-3xl md:text-4xl font-semibold text-charcoal-900 mb-4">
              Ready to make a difference?
            </h2>
            <p className="text-lg text-charcoal-600 mb-8 max-w-2xl mx-auto">
              Explore Kenya's water towers and discover how you can contribute to restoration efforts in your area.
            </p>
            <button
              onClick={() => navigate("/towers")}
              className="rounded-full bg-soft-green-600 hover:bg-soft-green-700 text-white px-10 py-4 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300"
            >
              Choose a Water Tower
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryPage;

