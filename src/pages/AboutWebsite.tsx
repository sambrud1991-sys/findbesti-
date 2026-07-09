import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Video, MessageCircle, Gift, Crown, Shield, Sparkles,
  Users, Coins, Trophy, Heart, Phone, Star, ArrowRight,
  Globe, Zap, CheckCircle2
} from "lucide-react";

const baseUrl = "https://www.findbesti.online";

const routeMeta = {
  "/website": {
    title: "FindBesti — Video Chat, Audio Calls & Virtual Gifts",
    description: "Discover FindBesti: the new-age video chat app to meet, chat and go live with people worldwide. HD calls, real-time chat, virtual gifts, premium plans and a coin economy that rewards you.",
    canonical: `${baseUrl}/website`,
  },
  "/about": {
    title: "About FindBesti — Meet, Chat & Earn Coins",
    description: "Learn about FindBesti: HD video calls, audio calls, real-time messaging, virtual gifts, leaderboards, premium perks and UPI withdrawals starting at ₹100.",
    canonical: `${baseUrl}/about`,
  },
};

const PageSeo = () => {
  const { pathname } = useLocation();
  const meta = routeMeta[pathname as keyof typeof routeMeta] || routeMeta["/website"];
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={meta.canonical} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={meta.canonical} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
    </Helmet>
  );
};


const syne = { fontFamily: "'Syne', sans-serif" };
const jakarta = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

const features = [
  { icon: Video, title: "HD Video Calls", desc: "Crystal clear video calls with people worldwide using Agora SDK." },
  { icon: MessageCircle, title: "Real-time Chat", desc: "Instant messaging with typing indicators and delivery status." },
  { icon: Gift, title: "Virtual Gifts", desc: "Send roses, hearts, diamonds & crowns to your favorites." },
  { icon: Crown, title: "Premium Plans", desc: "Unlock super likes, profile boost, VIP badge & more." },
  { icon: Coins, title: "Earn Coins", desc: "Daily login rewards, tasks, referrals — earn while you connect." },
  { icon: Shield, title: "Safe & Secure", desc: "Verified profiles, block & report tools, screen protection." },
  { icon: Trophy, title: "Leaderboards", desc: "Compete as top earners, referrers and most popular stars." },
  { icon: Globe, title: "Global Reach", desc: "Filter by country and meet new friends across the world." },
];

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "50K+", label: "Daily Calls" },
  { value: "4.8★", label: "User Rating" },
  { value: "100+", label: "Countries" },
];

const steps = [
  { n: "01", t: "Sign Up Free", d: "Quick phone or Google sign-in. Get started in seconds." },
  { n: "02", t: "Create Profile", d: "Add photos, bio & interests. Get verified for a blue tick." },
  { n: "03", t: "Discover People", d: "Browse profiles, filter by country & find your vibe." },
  { n: "04", t: "Connect & Earn", d: "Call, chat, gift — earn coins & withdraw to your UPI." },
];

const AboutWebsite = () => {
  return (
    <>
      <PageSeo />
      <div className="min-h-screen bg-[#0a0418] text-white overflow-x-hidden" style={jakarta}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-pink-500/20 blur-[160px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[140px]" />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-violet-700/20 blur-[140px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 max-w-7xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-700 flex items-center justify-center shadow-lg shadow-pink-500/40">
            <Heart className="w-5 h-5" fill="white" />
          </div>
          <span style={syne} className="text-2xl font-extrabold tracking-tight">FindBesti</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#how" className="hover:text-white transition">How it works</a>
          <a href="#premium" className="hover:text-white transition">Premium</a>
          <a href="#earn" className="hover:text-white transition">Earn</a>
        </div>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition"
        >
          Open App
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-xs font-medium text-white/80">New: Daily login rewards & gifts</span>
            </div>
            <h1 style={syne} className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight">
              Meet, chat & <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">go live</span> with the world.
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-xl leading-relaxed">
              FindBesti is the new-age video chat app where strangers turn into besties.
              HD calls, real-time chat, virtual gifts and a coin economy that rewards you for being social.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 font-semibold shadow-xl shadow-pink-500/30 hover:scale-105 transition"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm font-semibold hover:bg-white/10 transition"
              >
                Explore Features
              </a>
            </div>
            <div className="mt-10 grid grid-cols-4 gap-4 max-w-md">
              {stats.map((s) => (
                <div key={s.label}>
                  <div style={syne} className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">{s.value}</div>
                  <div className="text-[11px] text-white/50 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Phone mock */}
          <div className="relative flex justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-purple-600/30 blur-3xl rounded-full" />
            <div className="relative w-[280px] h-[560px] rounded-[3rem] border-[10px] border-white/10 bg-gradient-to-b from-[#1a0a2e] to-[#0a0418] shadow-2xl shadow-purple-900/50 overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-7 bg-black/40 flex justify-center items-end pb-1">
                <div className="w-20 h-4 bg-black rounded-b-2xl" />
              </div>
              <div className="pt-10 px-4 h-full flex flex-col">
                <div className="text-center mt-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 mx-auto shadow-lg shadow-pink-500/50" />
                  <div style={syne} className="mt-3 font-bold text-lg">Priya, 24 🇮🇳</div>
                  <div className="text-xs text-green-400 flex items-center justify-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Online now
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-pink-500/30 to-purple-600/30 border border-white/10 flex flex-col items-center justify-center gap-1">
                    <Video className="w-6 h-6 text-pink-300" />
                    <span className="text-[10px]">Video</span>
                  </div>
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-500/30 to-violet-700/30 border border-white/10 flex flex-col items-center justify-center gap-1">
                    <Phone className="w-6 h-6 text-purple-300" />
                    <span className="text-[10px]">Audio</span>
                  </div>
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-fuchsia-500/30 to-pink-600/30 border border-white/10 flex flex-col items-center justify-center gap-1">
                    <MessageCircle className="w-6 h-6 text-fuchsia-300" />
                    <span className="text-[10px]">Chat</span>
                  </div>
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-amber-500/30 to-pink-600/30 border border-white/10 flex flex-col items-center justify-center gap-1">
                    <Gift className="w-6 h-6 text-amber-300" />
                    <span className="text-[10px]">Gift</span>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <div className="flex-1">
                    <div className="text-xs text-white/60">Your coins</div>
                    <div className="text-sm font-bold">1,250 🪙</div>
                  </div>
                  <div className="text-[10px] px-2 py-1 rounded-full bg-pink-500/20 text-pink-300">+50 today</div>
                </div>
              </div>
            </div>
            {/* Floating chips */}
            <div className="absolute -left-6 top-20 px-3 py-2 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 flex items-center gap-2 shadow-xl">
              <span className="text-xl">🌹</span>
              <div>
                <div className="text-[10px] text-white/60">Gift received</div>
                <div className="text-xs font-bold">+10 coins</div>
              </div>
            </div>
            <div className="absolute -right-4 bottom-32 px-3 py-2 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 flex items-center gap-2 shadow-xl">
              <Trophy className="w-4 h-4 text-amber-300" />
              <div>
                <div className="text-[10px] text-white/60">Rank #12</div>
                <div className="text-xs font-bold">Top Earner</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 mb-4">
            <Zap className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-xs font-semibold text-pink-300">FEATURES</span>
          </div>
          <h2 style={syne} className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Everything you need to <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">connect</span>.
          </h2>
          <p className="mt-4 text-white/60 max-w-2xl mx-auto">A full social experience built mobile-first — calls, chat, gifts, coins, premium and more.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative p-6 rounded-3xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 hover:border-pink-400/40 transition overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-pink-500/0 group-hover:bg-pink-500/20 blur-2xl transition" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30 mb-4">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 style={syne} className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 style={syne} className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Start in <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">4 steps</span>.
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-5">
          {steps.map((s) => (
            <div key={s.n} className="p-6 rounded-3xl bg-gradient-to-br from-pink-500/10 to-purple-600/10 border border-white/10 backdrop-blur-sm">
              <div style={syne} className="text-4xl font-extrabold bg-gradient-to-br from-pink-400 to-purple-500 bg-clip-text text-transparent">{s.n}</div>
              <h3 style={syne} className="mt-3 text-lg font-bold">{s.t}</h3>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Premium + Earn split */}
      <section id="premium" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative p-8 rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-500 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/20 blur-3xl" />
            <Crown className="w-10 h-10 mb-4" />
            <h3 style={syne} className="text-3xl font-extrabold">Go Premium</h3>
            <p className="mt-2 text-white/85">Unlimited likes, see who liked you, VIP badge, profile boost & priority matching.</p>
            <ul className="mt-6 space-y-2 text-sm">
              {["Unlimited likes", "Super likes x5", "Read receipts", "VIP badge"].map((x) => (
                <li key={x} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {x}</li>
              ))}
            </ul>
            <Link to="/" className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-purple-700 font-bold text-sm hover:scale-105 transition">
              Upgrade Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div id="earn" className="relative p-8 rounded-3xl bg-gradient-to-br from-[#1a0a2e] to-[#0f0420] border border-white/10 overflow-hidden">
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-amber-400/20 blur-3xl" />
            <Coins className="w-10 h-10 text-amber-400 mb-4" />
            <h3 style={syne} className="text-3xl font-extrabold">Earn Real Money</h3>
            <p className="mt-2 text-white/70">Convert gifts & tasks into coins, then withdraw to UPI from just ₹100.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div style={syne} className="text-2xl font-extrabold text-amber-300">+5</div>
                <div className="text-xs text-white/60">Daily login</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div style={syne} className="text-2xl font-extrabold text-pink-300">+50</div>
                <div className="text-xs text-white/60">Per referral</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div style={syne} className="text-2xl font-extrabold text-purple-300">+100</div>
                <div className="text-xs text-white/60">Invite tasks</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div style={syne} className="text-2xl font-extrabold text-fuchsia-300">₹100</div>
                <div className="text-xs text-white/60">Min withdraw</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 style={syne} className="text-4xl md:text-5xl font-extrabold tracking-tight">Loved by our community</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n: "Aarav", l: "Mumbai 🇮🇳", t: "Best video chat app I've used. Quality is amazing and I made real friends!" },
            { n: "Sara", l: "Delhi 🇮🇳", t: "Earned ₹2000 in a month just by being active. Withdrawal was super smooth." },
            { n: "Rohit", l: "Bangalore 🇮🇳", t: "The gift system is so fun and the leaderboard keeps me coming back daily." },
          ].map((r) => (
            <div key={r.n} className="p-6 rounded-3xl bg-white/[0.04] border border-white/10">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400" fill="currentColor" />
                ))}
              </div>
              <p className="text-white/80 text-sm leading-relaxed">"{r.t}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600" />
                <div>
                  <div style={syne} className="font-bold text-sm">{r.n}</div>
                  <div className="text-xs text-white/50">{r.l}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="relative p-10 md:p-16 rounded-[2.5rem] bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-700 overflow-hidden text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.3),transparent_50%)]" />
          <div className="relative">
            <Users className="w-12 h-12 mx-auto mb-4" />
            <h2 style={syne} className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Your besti is one tap away.
            </h2>
            <p className="mt-4 text-white/90 max-w-xl mx-auto">
              Join thousands already connecting on FindBesti. Free forever, premium when you want more.
            </p>
            <Link to="/" className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-purple-700 font-bold shadow-2xl hover:scale-105 transition">
              Open the App <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-10">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-700 flex items-center justify-center">
              <Heart className="w-4 h-4" fill="white" />
            </div>
            <span style={syne} className="font-bold text-white">FindBesti</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/" className="hover:text-white">Open App</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutWebsite;
