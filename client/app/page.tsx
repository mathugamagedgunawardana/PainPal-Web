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
  Waves
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#f8f9ff] via-white to-[#f0f9ff] flex flex-col">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-linear-to-br from-[#b3c6fc] to-[#7ad7d7] rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#2d3748]">MigraineAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-[#4b5563] hover:text-[#7ad7d7] transition-colors">Features</Link>
            <Link href="#how" className="text-[#4b5563] hover:text-[#7ad7d7] transition-colors">How It Works</Link>
            <Link href="#testimonials" className="text-[#4b5563] hover:text-[#7ad7d7] transition-colors">Reviews</Link>
            <Link href="/signin" className="bg-linear-to-r from-[#b3c6fc] to-[#7ad7d7] text-white px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-linear-to-br from-[#f8f9ff] via-white to-[#f0f9ff] opacity-70" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
            {/* Hero Content */}
            <div className="flex-1 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#e6e6fa]/30 rounded-full mb-6 border border-[#b3c6fc]/20">
                <Sparkle className="w-4 h-4 text-[#7ad7d7]" />
                <span className="text-sm font-medium text-[#4b4b6b]">AI-Powered Migraine Management</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-[#1a202c] mb-6 leading-tight">
                Manage Your Migraines <br />
                <span className="bg-linear-to-r from-[#b3c6fc] via-[#7ad7d7] to-[#60c5c5] bg-clip-text text-transparent">With Confidence</span>
              </h1>
              <p className="text-xl text-[#4b5563] mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Take control of your health with intelligent tracking, predictive insights, and personalized care plans designed by medical experts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link href="#download" className="bg-linear-to-r from-[#b3c6fc] to-[#7ad7d7] text-white px-10 py-4 rounded-full shadow-2xl hover:shadow-[#b3c6fc]/50 transition-all duration-300 inline-flex items-center justify-center gap-2 text-lg font-semibold">
                  <Smartphone className="w-5 h-5" />
                  <span>Download App</span>
                </Link>
                <Link href="#learn" className="bg-white border-2 border-gray-200 text-[#4b5563] px-10 py-4 rounded-full hover:border-[#b3c6fc] hover:bg-[#f8f9ff] transition-all duration-300 inline-flex items-center justify-center gap-2 text-lg font-semibold">
                  <span>Watch Demo</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-[#1a202c]">50K+</div>
                  <div className="text-sm text-[#6b7280]">Active Users</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-[#1a202c]">94%</div>
                  <div className="text-sm text-[#6b7280]">Accuracy</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-[#1a202c]">4.9★</div>
                  <div className="text-sm text-[#6b7280]">App Rating</div>
                </div>
              </div>
            </div>
            {/* Hero Illustration */}
            <div className="flex-1 relative">
              <div className="relative w-full max-w-[600px] mx-auto">
                <div className="absolute -top-10 -left-10 w-72 h-72 bg-[#b3c6fc]/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-[#7ad7d7]/20 rounded-full blur-3xl" />
                <div className="relative bg-white/60 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/20 p-8 overflow-hidden">
                  <div className="relative aspect-square w-full rounded-3xl overflow-hidden">
                    <Image
                      src="https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?auto=format&fit=crop&w=900&q=80"
                      alt="Person using a mobile health app"
                      fill
                      sizes="(min-width: 1024px) 520px, 80vw"
                      className="object-cover"
                      priority
                    />
                  </div>
                  {/* Floating Elements */}
                  <div className="absolute top-10 right-10 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-linear-to-br from-[#b3c6fc] to-[#7ad7d7] rounded-xl flex items-center justify-center">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-[#6b7280]">Prediction</div>
                        <div className="text-sm font-bold text-[#1a202c]">Low Risk</div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-10 left-10 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-linear-to-br from-[#7ad7d7] to-[#60c5c5] rounded-xl flex items-center justify-center">
                        <Bell className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-[#6b7280]">Reminder</div>
                        <div className="text-sm font-bold text-[#1a202c]">Take Meds</div>
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
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#e6e6fa]/30 rounded-full mb-4 border border-[#b3c6fc]/20">
              <Sparkle className="w-4 h-4 text-[#7ad7d7]" />
              <span className="text-sm font-medium text-[#4b4b6b]">Smart Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a202c] mb-6">
              Everything You Need to <span className="text-[#7ad7d7]">Stay Healthy</span>
            </h2>
            <p className="text-xl text-[#4b5563] max-w-3xl mx-auto">
              Our platform combines cutting-edge AI technology with medical expertise to provide personalized migraine management.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="group rounded-3xl bg-linear-to-br from-white to-[#f8f9ff] shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 hover:border-[#b3c6fc]">
              <div className="w-16 h-16 bg-linear-to-br from-[#b3c6fc] to-[#7ad7d7] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a202c] mb-3">Smart Tracking</h3>
              <p className="text-[#4b5563] leading-relaxed">Log symptoms, triggers, and episodes effortlessly. Visualize patterns with beautiful, intuitive charts.</p>
            </div>
            {/* Feature 2 */}
            <div className="group rounded-3xl bg-linear-to-br from-white to-[#f8f9ff] shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 hover:border-[#b3c6fc]">
              <div className="w-16 h-16 bg-linear-to-br from-[#7ad7d7] to-[#60c5c5] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a202c] mb-3">AI Predictions</h3>
              <p className="text-[#4b5563] leading-relaxed">Get early warnings for potential episodes using advanced machine learning and your personal health data.</p>
            </div>
            {/* Feature 3 */}
            <div className="group rounded-3xl bg-linear-to-br from-white to-[#f8f9ff] shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 hover:border-[#b3c6fc]">
              <div className="w-16 h-16 bg-linear-to-br from-[#b3c6fc] to-[#9bb5fc] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Pill className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a202c] mb-3">Med Reminders</h3>
              <p className="text-[#4b5563] leading-relaxed">Never miss a dose with smart, timely reminders that adapt to your schedule and treatment plan.</p>
            </div>
            {/* Feature 4 */}
            <div className="group rounded-3xl bg-linear-to-br from-white to-[#f8f9ff] shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 hover:border-[#b3c6fc]">
              <div className="w-16 h-16 bg-linear-to-br from-[#7ad7d7] to-[#6bc5c5] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <HeartPulse className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a202c] mb-3">Lifestyle Insights</h3>
              <p className="text-[#4b5563] leading-relaxed">Discover personalized recommendations based on your unique triggers and lifestyle patterns.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="py-24 bg-linear-to-br from-[#f8f9ff] to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#b3c6fc]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#7ad7d7]/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full mb-4 border border-gray-200 shadow-sm">
              <Sparkle className="w-4 h-4 text-[#7ad7d7]" />
              <span className="text-sm font-medium text-[#4b4b6b]">Simple Process</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a202c] mb-6">
              How It Works
            </h2>
            <p className="text-xl text-[#4b5563] max-w-3xl mx-auto">
              Get started in minutes with our intuitive three-step process designed for simplicity and effectiveness.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-linear-to-br from-[#b3c6fc] to-[#9bb5fc] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#7ad7d7] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">1</div>
                <h3 className="text-xl font-bold text-[#1a202c] mb-3">Download & Sign Up</h3>
                <p className="text-[#4b5563] leading-relaxed">Get the app from your store and create your secure account in seconds.</p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-linear-to-br from-[#7ad7d7] to-[#60c5c5] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#b3c6fc] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">2</div>
                <h3 className="text-xl font-bold text-[#1a202c] mb-3">Track Symptoms</h3>
                <p className="text-[#4b5563] leading-relaxed">Log your daily symptoms, triggers, and episodes with our easy-to-use interface.</p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-linear-to-br from-[#b3c6fc] to-[#7ad7d7] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Sparkle className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#7ad7d7] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">3</div>
                <h3 className="text-xl font-bold text-[#1a202c] mb-3">Get Insights</h3>
                <p className="text-[#4b5563] leading-relaxed">Receive AI-powered predictions and personalized recommendations instantly.</p>
              </div>
            </div>
            {/* Step 4 */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-linear-to-br from-[#60c5c5] to-[#7ad7d7] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#b3c6fc] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">4</div>
                <h3 className="text-xl font-bold text-[#1a202c] mb-3">Stay Healthy</h3>
                <p className="text-[#4b5563] leading-relaxed">Follow your personalized care plan and enjoy better migraine management.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#e6e6fa]/30 rounded-full mb-4 border border-[#b3c6fc]/20">
              <Star className="w-4 h-4 text-[#7ad7d7]" />
              <span className="text-sm font-medium text-[#4b4b6b]">Testimonials</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a202c] mb-6">
              Trusted by <span className="text-[#7ad7d7]">Thousands</span>
            </h2>
            <p className="text-xl text-[#4b5563] max-w-3xl mx-auto">
              Real stories from people who transformed their migraine management with our platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-[#fbbf24] text-[#fbbf24]" />)}
              </div>
              <p className="text-[#4b5563] text-lg mb-6 leading-relaxed">"This app completely changed how I manage my migraines. The AI predictions are incredibly accurate and have helped me prevent so many episodes."</p>
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-lg">
                  <Image
                    src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=160&q=80"
                    alt="Sarah Chen"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-[#1a202c]">Sarah Chen</div>
                  <div className="text-sm text-[#6b7280]">Marketing Director</div>
                </div>
              </div>
            </div>
            {/* Testimonial 2 */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-[#fbbf24] text-[#fbbf24]" />)}
              </div>
              <p className="text-[#4b5563] text-lg mb-6 leading-relaxed">"The medication reminders and lifestyle insights are game-changers. I finally feel in control of my health and can live without constant worry."</p>
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-lg">
                  <Image
                    src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=160&q=80"
                    alt="Michael Johnson"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-[#1a202c]">Michael Johnson</div>
                  <div className="text-sm text-[#6b7280]">Software Engineer</div>
                </div>
              </div>
            </div>
            {/* Testimonial 3 */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-[#fbbf24] text-[#fbbf24]" />)}
              </div>
              <p className="text-[#4b5563] text-lg mb-6 leading-relaxed">"Beautiful, intuitive design paired with powerful features. Best migraine tracking app I've tried. My doctor loves the detailed reports!"</p>
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-lg">
                  <Image
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80"
                    alt="Emma Silva"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-[#1a202c]">Emma Silva</div>
                  <div className="text-sm text-[#6b7280]">Teacher</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Screens Showcase */}
      <section id="screens" className="py-24 bg-linear-to-br from-[#f8f9ff] to-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#7ad7d7]/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full mb-4 border border-gray-200 shadow-sm">
              <Smartphone className="w-4 h-4 text-[#7ad7d7]" />
              <span className="text-sm font-medium text-[#4b4b6b]">App Preview</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a202c] mb-6">
              Experience the <span className="text-[#7ad7d7]">Interface</span>
            </h2>
            <p className="text-xl text-[#4b5563] max-w-3xl mx-auto">
              A glimpse into our beautifully designed, intuitive app that makes migraine management effortless.
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-end gap-6 relative">
            <div className="relative w-[200px] md:w-60">
              <div className="bg-white rounded-[2.5rem] shadow-2xl border-8 border-gray-900 overflow-hidden transform hover:scale-105 transition-all duration-300 -rotate-6">
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
            <div className="relative w-[220px] md:w-[260px] z-10">
              <div className="bg-white rounded-[2.5rem] shadow-2xl border-8 border-gray-900 overflow-hidden transform hover:scale-105 transition-all duration-300">
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
            <div className="relative w-[200px] md:w-60">
              <div className="bg-white rounded-[2.5rem] shadow-2xl border-8 border-gray-900 overflow-hidden transform hover:scale-105 transition-all duration-300 rotate-6">
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
      </section>

      {/* CTA Banner */}
      <section id="download" className="py-20 bg-linear-to-r from-[#b3c6fc] via-[#7ad7d7] to-[#60c5c5] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start Your Journey to Better Health
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands who have transformed their migraine management. Download now and take control of your health today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="#" className="bg-white text-[#7ad7d7] px-10 py-4 rounded-full shadow-2xl hover:shadow-white/50 transition-all duration-300 inline-flex items-center justify-center gap-3 text-lg font-bold hover:scale-105">
              <Image src="/appstore-icon.svg" alt="App Store" width={24} height={24} className="w-6 h-6" />
              <span>Download on App Store</span>
            </Link>
            <Link href="#" className="bg-[#1a202c] text-white px-10 py-4 rounded-full shadow-2xl hover:shadow-black/50 transition-all duration-300 inline-flex items-center justify-center gap-3 text-lg font-bold hover:scale-105">
              <Image src="/playstore-icon.svg" alt="Google Play" width={24} height={24} className="w-6 h-6" />
              <span>Get it on Google Play</span>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-8 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-white/80" />
              <span>4.9 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>50K+ Users</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a202c] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-linear-to-br from-[#b3c6fc] to-[#7ad7d7] rounded-2xl flex items-center justify-center shadow-lg">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold">MigraineAI</span>
              </div>
              <p className="text-gray-400 max-w-md leading-relaxed mb-6">
                Transform your migraine management with AI-powered insights, personalized care plans, and expert support.
              </p>
              <div className="flex gap-4">
                <Link href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/><path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </Link>
                <Link href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
                </Link>
                <Link href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </Link>
              </div>
            </div>
            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-4">Product</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#how" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">© 2025 MigraineAI. All rights reserved.</p>
            <p className="text-gray-400 text-sm">Made with ❤️ for better health</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
