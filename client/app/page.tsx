import Image from "next/image";
import Link from "next/link";
import {
  Brain,
  Bell,
  Calendar,
  HeartPulse,
  Star,
  Smartphone,
  User,
  ArrowRight,
  ShieldCheck,
  Activity,
  Pill,
  Sparkle,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-indigo-50 via-white to-amber-50/35">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-indigo-100/80 bg-white/75 backdrop-blur-xl shadow-sm shadow-indigo-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-linear-to-br from-violet-500 via-indigo-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-300/40 ring-2 ring-white/80 group-hover:scale-[1.03] transition-transform">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-linear-to-r from-slate-800 via-violet-700 to-teal-600 bg-clip-text text-transparent">
              PainPal AI
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-7 lg:gap-9">
            <Link href="#features" className="text-slate-600 text-sm font-medium hover:text-violet-600 transition-colors">
              Features
            </Link>
            <Link href="#how" className="text-slate-600 text-sm font-medium hover:text-teal-600 transition-colors">
              How It Works
            </Link>
            <Link href="#testimonials" className="text-slate-600 text-sm font-medium hover:text-amber-600 transition-colors">
              Reviews
            </Link>
            <Link
              href="/signin"
              className="text-sm font-semibold text-white bg-linear-to-r from-violet-600 via-indigo-600 to-teal-500 px-6 py-2.5 rounded-full shadow-lg shadow-indigo-400/35 hover:shadow-indigo-400/50 hover:brightness-[1.05] transition-all ring-2 ring-white/30"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.22),transparent)]" />
        <div className="pointer-events-none absolute top-24 right-0 h-72 w-72 rounded-full bg-fuchsia-300/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 right-1/4 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-24 sm:pb-32 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-14 lg:gap-16">
            {/* Hero Content */}
            <div className="flex-1 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 bg-linear-to-r from-violet-100/90 via-indigo-50 to-teal-100/80 border border-violet-200/60 shadow-sm shadow-violet-200/30">
                <Sparkle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-sm font-semibold text-slate-700">AI-Powered Migraine Management</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-[1.08] tracking-tight">
                Manage Your Migraines <br />
                <span className="bg-linear-to-r from-violet-600 via-indigo-500 to-teal-500 bg-clip-text text-transparent">
                  With Confidence
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Take control of your health with intelligent tracking, predictive insights, and personalized care plans designed by medical experts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link
                  href="#download"
                  className="inline-flex items-center justify-center gap-2 text-lg font-semibold text-white bg-linear-to-r from-violet-600 via-indigo-600 to-teal-500 px-10 py-4 rounded-full shadow-xl shadow-indigo-400/30 hover:shadow-indigo-400/45 hover:brightness-[1.06] transition-all duration-300"
                >
                  <Smartphone className="w-5 h-5 shrink-0" />
                  <span>Download App</span>
                </Link>
                <Link
                  href="#learn"
                  className="inline-flex items-center justify-center gap-2 text-lg font-semibold text-slate-700 bg-white/90 border-2 border-slate-200/90 px-10 py-4 rounded-full hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-800 transition-all duration-300 shadow-md shadow-slate-200/40"
                >
                  <span>Watch Demo</span>
                  <ArrowRight className="w-5 h-5 text-violet-500 shrink-0" />
                </Link>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0">
                <div className="rounded-2xl px-3 py-4 sm:p-4 text-center lg:text-left bg-linear-to-br from-violet-50 to-white border border-violet-100 shadow-sm">
                  <div className="text-2xl sm:text-3xl font-bold text-violet-700">50K+</div>
                  <div className="text-xs sm:text-sm text-slate-500 font-medium">Active Users</div>
                </div>
                <div className="rounded-2xl px-3 py-4 sm:p-4 text-center lg:text-left bg-linear-to-br from-teal-50 to-white border border-teal-100 shadow-sm">
                  <div className="text-2xl sm:text-3xl font-bold text-teal-700">94%</div>
                  <div className="text-xs sm:text-sm text-slate-500 font-medium">Accuracy</div>
                </div>
                <div className="rounded-2xl px-3 py-4 sm:p-4 text-center lg:text-left bg-linear-to-br from-amber-50 to-white border border-amber-100 shadow-sm">
                  <div className="text-2xl sm:text-3xl font-bold text-amber-700">4.9★</div>
                  <div className="text-xs sm:text-sm text-slate-500 font-medium">App Rating</div>
                </div>
              </div>
            </div>
            {/* Hero Illustration */}
            <div className="flex-1 relative w-full">
              <div className="relative w-full max-w-[560px] lg:max-w-[600px] mx-auto">
                <div className="absolute -top-8 -left-4 sm:-left-10 h-64 w-64 sm:h-72 sm:w-72 rounded-full bg-violet-400/25 blur-3xl" />
                <div className="absolute -bottom-8 -right-4 sm:-right-10 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-teal-400/20 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-rose-200/20 blur-2xl" />
                <div className="relative p-1 rounded-[2.5rem] bg-linear-to-br from-violet-400 via-indigo-400 to-teal-400 shadow-2xl shadow-indigo-300/40">
                  <div className="rounded-[2.35rem] bg-white/90 backdrop-blur-xl p-6 sm:p-8 overflow-hidden ring-1 ring-white/60">
                    <div className="relative aspect-square w-full rounded-3xl overflow-hidden ring-1 ring-slate-200/80 shadow-inner">
                      <Image
                        src="/images/hero-migraine-person.png"
                        alt="Person with migraine holding temples, illustrating headache pain many users track in the app"
                        fill
                        sizes="(min-width: 1024px) 520px, 80vw"
                        className="object-cover object-top"
                        priority
                      />
                    </div>
                    {/* Floating Elements */}
                    <div className="absolute top-6 sm:top-10 right-4 sm:right-8 rounded-2xl bg-white/95 backdrop-blur-md p-3 sm:p-4 border border-violet-100 shadow-lg shadow-violet-200/40 max-w-[calc(100%-2rem)]">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 bg-linear-to-br from-violet-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                          <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500 font-medium">Prediction</div>
                          <div className="text-sm font-bold text-emerald-700">Low Risk</div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-6 sm:bottom-10 left-4 sm:left-8 rounded-2xl bg-white/95 backdrop-blur-md p-3 sm:p-4 border border-teal-100 shadow-lg shadow-teal-200/40 max-w-[calc(100%-2rem)]">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 bg-linear-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500 font-medium">Reminder</div>
                          <div className="text-sm font-bold text-indigo-800">Take Meds</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-white via-violet-50/40 to-cyan-50/30" />
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-violet-300/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 border border-fuchsia-200/80 bg-fuchsia-50/80 shadow-sm">
              <Sparkle className="w-4 h-4 text-fuchsia-500" />
              <span className="text-sm font-semibold text-fuchsia-900/80">Smart Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 tracking-tight">
              Everything You Need to{" "}
              <span className="bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Stay Healthy</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Our platform combines cutting-edge AI technology with medical expertise to provide personalized migraine management.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
            {/* Feature 1 */}
            <div className="group relative rounded-3xl p-8 border border-violet-200/60 bg-linear-to-br from-white to-violet-50/90 shadow-lg shadow-violet-100/50 hover:shadow-xl hover:shadow-violet-200/40 hover:border-violet-300 transition-all duration-300 hover:-translate-y-0.5">
              <div className="absolute top-0 left-8 right-8 h-1 rounded-b-full bg-linear-to-r from-violet-400 to-indigo-400 opacity-80" />
              <div className="w-14 h-14 bg-linear-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-violet-400/30">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Tracking</h3>
              <p className="text-slate-600 leading-relaxed">
                Log symptoms, triggers, and episodes effortlessly. Visualize patterns with beautiful, intuitive charts.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="group relative rounded-3xl p-8 border border-teal-200/60 bg-linear-to-br from-white to-teal-50/90 shadow-lg shadow-teal-100/50 hover:shadow-xl hover:shadow-teal-200/40 hover:border-teal-300 transition-all duration-300 hover:-translate-y-0.5">
              <div className="absolute top-0 left-8 right-8 h-1 rounded-b-full bg-linear-to-r from-teal-400 to-emerald-500 opacity-80" />
              <div className="w-14 h-14 bg-linear-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-teal-400/30">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI Predictions</h3>
              <p className="text-slate-600 leading-relaxed">
                Get early warnings for potential episodes using advanced machine learning and your personal health data.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="group relative rounded-3xl p-8 border border-amber-200/60 bg-linear-to-br from-white to-amber-50/90 shadow-lg shadow-amber-100/50 hover:shadow-xl hover:shadow-amber-200/40 hover:border-amber-300 transition-all duration-300 hover:-translate-y-0.5">
              <div className="absolute top-0 left-8 right-8 h-1 rounded-b-full bg-linear-to-r from-amber-400 to-orange-500 opacity-80" />
              <div className="w-14 h-14 bg-linear-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-amber-400/30">
                <Pill className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Med Reminders</h3>
              <p className="text-slate-600 leading-relaxed">
                Never miss a dose with smart, timely reminders that adapt to your schedule and treatment plan.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="group relative rounded-3xl p-8 border border-rose-200/60 bg-linear-to-br from-white to-rose-50/90 shadow-lg shadow-rose-100/50 hover:shadow-xl hover:shadow-rose-200/40 hover:border-rose-300 transition-all duration-300 hover:-translate-y-0.5">
              <div className="absolute top-0 left-8 right-8 h-1 rounded-b-full bg-linear-to-r from-rose-400 to-fuchsia-500 opacity-80" />
              <div className="w-14 h-14 bg-linear-to-br from-rose-500 to-fuchsia-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-rose-400/30">
                <HeartPulse className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Lifestyle Insights</h3>
              <p className="text-slate-600 leading-relaxed">
                Discover personalized recommendations based on your unique triggers and lifestyle patterns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-100/50 via-sky-50/40 to-emerald-50/50" />
        <div className="absolute top-20 right-10 h-64 w-64 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 border border-sky-200 bg-white/90 shadow-sm">
              <Sparkle className="w-4 h-4 text-sky-500" />
              <span className="text-sm font-semibold text-sky-900/80">Simple Process</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 tracking-tight">
              How It <span className="text-indigo-600">Works</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Get started in minutes with our intuitive three-step process designed for simplicity and effectiveness.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
            {/* Step 1 */}
            <div className="relative group">
              <div className="h-full rounded-3xl p-8 border-2 border-indigo-100 bg-white/95 shadow-xl shadow-indigo-100/40 hover:border-indigo-300 hover:shadow-2xl transition-all duration-300">
                <div className="w-14 h-14 bg-linear-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-11 h-11 bg-linear-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-white">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Download & Sign Up</h3>
                <p className="text-slate-600 leading-relaxed">Get the app from your store and create your secure account in seconds.</p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="relative group">
              <div className="h-full rounded-3xl p-8 border-2 border-teal-100 bg-white/95 shadow-xl shadow-teal-100/40 hover:border-teal-300 hover:shadow-2xl transition-all duration-300">
                <div className="w-14 h-14 bg-linear-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-11 h-11 bg-linear-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-white">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Track Symptoms</h3>
                <p className="text-slate-600 leading-relaxed">Log your daily symptoms, triggers, and episodes with our easy-to-use interface.</p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="relative group">
              <div className="h-full rounded-3xl p-8 border-2 border-amber-100 bg-white/95 shadow-xl shadow-amber-100/40 hover:border-amber-300 hover:shadow-2xl transition-all duration-300">
                <div className="w-14 h-14 bg-linear-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Sparkle className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-11 h-11 bg-linear-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-white">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Get Insights</h3>
                <p className="text-slate-600 leading-relaxed">Receive AI-powered predictions and personalized recommendations instantly.</p>
              </div>
            </div>
            {/* Step 4 */}
            <div className="relative group">
              <div className="h-full rounded-3xl p-8 border-2 border-rose-100 bg-white/95 shadow-xl shadow-rose-100/40 hover:border-rose-300 hover:shadow-2xl transition-all duration-300">
                <div className="w-14 h-14 bg-linear-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-3 -right-3 w-11 h-11 bg-linear-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-white">
                  4
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Stay Healthy</h3>
                <p className="text-slate-600 leading-relaxed">Follow your personalized care plan and enjoy better migraine management.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-amber-50/60 via-orange-50/30 to-white" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-violet-50/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 border border-amber-200 bg-amber-50/90 shadow-sm">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span className="text-sm font-semibold text-amber-900/80">Testimonials</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 tracking-tight">
              Trusted by{" "}
              <span className="bg-linear-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Thousands</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Real stories from people who transformed their migraine management with our platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Testimonial 1 */}
            <div className="rounded-3xl p-8 border border-violet-100 bg-white/95 shadow-xl shadow-violet-100/30 hover:shadow-violet-200/40 transition-shadow duration-300 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-linear-to-b from-violet-500 to-indigo-500 rounded-l-3xl" />
              <div className="flex gap-1 mb-4 pl-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 text-lg mb-6 leading-relaxed pl-1">
                &ldquo;This app completely changed how I manage my migraines. The AI predictions are incredibly accurate and have helped me prevent so many episodes.&rdquo;
              </p>
              <div className="flex items-center gap-4 pl-1">
                <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-lg ring-2 ring-violet-100">
                  <Image
                    src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=160&q=80"
                    alt="Sarah Chen"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Sarah Chen</div>
                  <div className="text-sm text-violet-600/90 font-medium">Marketing Director</div>
                </div>
              </div>
            </div>
            {/* Testimonial 2 */}
            <div className="rounded-3xl p-8 border border-teal-100 bg-white/95 shadow-xl shadow-teal-100/30 hover:shadow-teal-200/40 transition-shadow duration-300 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-linear-to-b from-teal-500 to-cyan-500 rounded-l-3xl" />
              <div className="flex gap-1 mb-4 pl-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 text-lg mb-6 leading-relaxed pl-1">
                &ldquo;The medication reminders and lifestyle insights are game-changers. I finally feel in control of my health and can live without constant worry.&rdquo;
              </p>
              <div className="flex items-center gap-4 pl-1">
                <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-lg ring-2 ring-teal-100">
                  <Image
                    src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=160&q=80"
                    alt="Michael Johnson"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Michael Johnson</div>
                  <div className="text-sm text-teal-600/90 font-medium">Software Engineer</div>
                </div>
              </div>
            </div>
            {/* Testimonial 3 */}
            <div className="rounded-3xl p-8 border border-rose-100 bg-white/95 shadow-xl shadow-rose-100/30 hover:shadow-rose-200/40 transition-shadow duration-300 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-linear-to-b from-rose-500 to-orange-500 rounded-l-3xl" />
              <div className="flex gap-1 mb-4 pl-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 text-lg mb-6 leading-relaxed pl-1">
                &ldquo;Beautiful, intuitive design paired with powerful features. Best migraine tracking app I&apos;ve tried. My doctor loves the detailed reports!&rdquo;
              </p>
              <div className="flex items-center gap-4 pl-1">
                <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-lg ring-2 ring-rose-100">
                  <Image
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80"
                    alt="Emma Silva"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Emma Silva</div>
                  <div className="text-sm text-rose-600/90 font-medium">Teacher</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Screens Showcase */}
      <section id="screens" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-indigo-950 to-violet-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(167,139,250,0.35),transparent)]" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 border border-white/20 bg-white/10 backdrop-blur-sm shadow-lg">
              <Smartphone className="w-4 h-4 text-teal-300" />
              <span className="text-sm font-semibold text-indigo-100">App Preview</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
              Experience the <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-300 to-cyan-200">Interface</span>
            </h2>
            <p className="text-lg sm:text-xl text-indigo-100/90 max-w-3xl mx-auto leading-relaxed">
              A glimpse into our beautifully designed, intuitive app that makes migraine management effortless.
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-end gap-6 sm:gap-8 relative">
            <div className="relative w-[200px] md:w-60">
              <div className="rounded-[2.5rem] p-[3px] bg-linear-to-br from-violet-400 via-fuchsia-500 to-rose-400 shadow-2xl shadow-violet-500/25 -rotate-6 hover:rotate-0 transition-transform duration-300">
                <div className="rounded-[2.35rem] bg-slate-900 overflow-hidden">
                  <div className="relative aspect-9/19 overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=600&q=80"
                      alt="App dashboard preview"
                      fill
                      sizes="(min-width: 768px) 240px, 50vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="relative w-[220px] md:w-[260px] z-10">
              <div className="rounded-[2.5rem] p-[3px] bg-linear-to-br from-teal-400 via-cyan-400 to-indigo-500 shadow-2xl shadow-teal-500/30 scale-105 hover:scale-110 transition-transform duration-300">
                <div className="rounded-[2.35rem] bg-slate-900 overflow-hidden">
                  <div className="relative aspect-9/19 overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=650&q=80"
                      alt="Health insights screen"
                      fill
                      sizes="(min-width: 768px) 260px, 55vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="relative w-[200px] md:w-60">
              <div className="rounded-[2.5rem] p-[3px] bg-linear-to-br from-amber-400 via-orange-400 to-pink-500 shadow-2xl shadow-amber-500/25 rotate-6 hover:rotate-0 transition-transform duration-300">
                <div className="rounded-[2.35rem] bg-slate-900 overflow-hidden">
                  <div className="relative aspect-9/19 overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80"
                      alt="Medication reminders screen"
                      fill
                      sizes="(min-width: 768px) 240px, 50vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section id="download" className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-violet-600 via-indigo-600 to-teal-500" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_30%_20%,rgba(255,255,255,0.2),transparent)]" />
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-[0.12]" />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 drop-shadow-sm tracking-tight">
            Start Your Journey to Better Health
          </h2>
          <p className="text-lg sm:text-xl text-white/95 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands who have transformed their migraine management. Download now and take control of your health today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="#"
              className="inline-flex items-center justify-center gap-3 text-lg font-bold text-violet-700 bg-white px-10 py-4 rounded-full shadow-2xl shadow-black/20 hover:bg-violet-50 hover:scale-[1.02] transition-all duration-300"
            >
              <Image src="/appstore-icon.svg" alt="App Store" width={24} height={24} className="w-6 h-6" />
              <span>Download on App Store</span>
            </Link>
            <Link
              href="#"
              className="inline-flex items-center justify-center gap-3 text-lg font-bold text-white bg-slate-900/90 border border-white/20 px-10 py-4 rounded-full shadow-2xl hover:bg-slate-900 hover:scale-[1.02] transition-all duration-300"
            >
              <Image src="/playstore-icon.svg" alt="Google Play" width={24} height={24} className="w-6 h-6" />
              <span>Get it on Google Play</span>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-white/90 text-sm font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-200" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
              <span>4.9 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-sky-200" />
              <span>50K+ Users</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative text-white pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-slate-900 via-indigo-950 to-slate-950" />
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-teal-400/50 to-transparent" />
        <div className="absolute top-20 right-0 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-violet-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/10">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold bg-linear-to-r from-white to-teal-100 bg-clip-text text-transparent">
                  PainPal AI
                </span>
              </div>
              <p className="text-slate-400 max-w-md leading-relaxed mb-6">
                Transform your migraine management with AI-powered insights, personalized care plans, and expert support.
              </p>
              <div className="flex gap-3">
                <Link
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-violet-500/40 flex items-center justify-center transition-colors ring-1 ring-white/10"
                >
                  <span className="sr-only">Instagram</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
                    <path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-sky-500/40 flex items-center justify-center transition-colors ring-1 ring-white/10"
                >
                  <span className="sr-only">Twitter</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-indigo-500/40 flex items-center justify-center transition-colors ring-1 ring-white/10"
                >
                  <span className="sr-only">Facebook</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </Link>
              </div>
            </div>
            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-teal-300">Product</h3>
              <ul className="space-y-3 text-slate-400">
                <li>
                  <Link href="#features" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#how" className="hover:text-white transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-violet-300">Company</h3>
              <ul className="space-y-3 text-slate-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">© 2025 PainPal AI. All rights reserved.</p>
            <p className="text-slate-500 text-sm">
              Made with <span className="text-rose-400">♥</span> for better health
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
