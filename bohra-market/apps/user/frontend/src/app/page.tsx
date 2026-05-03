import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ArrowRight, ShoppingBag, Store, Shield, Sparkles } from "lucide-react";

export default function HomePage() {
  const categories = [
    { emoji: "🍱", name: "Food & Groceries", slug: "food-groceries", desc: "Pickles, Mithai, Tiffin" },
    { emoji: "👗", name: "Clothing", slug: "clothing-accessories", desc: "Rida, Topi, Kurta" },
    { emoji: "🧵", name: "Handmade Crafts", slug: "handmade-crafts", desc: "Embroidery, Pottery" },
    { emoji: "🛎️", name: "Services", slug: "services", desc: "Catering, Tailoring" },
  ];

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Search",
      desc: 'Search naturally: "rida under ₹800 in Surat" and get instant results',
    },
    {
      icon: ShoppingBag,
      title: "Community Products",
      desc: "Authentic Bohra products from trusted community vendors",
    },
    {
      icon: Store,
      title: "Sell with Ease",
      desc: "Set up your vendor store in minutes with AI-assisted product listings",
    },
    {
      icon: Shield,
      title: "Verified Vendors",
      desc: "Every vendor is reviewed and approved by our community team",
    },
  ];

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-primary-500 text-white py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 text-9xl">🌙</div>
            <div className="absolute bottom-10 right-10 text-9xl">⭐</div>
          </div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <span className="inline-block bg-gold-500/20 text-gold-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Exclusively for the Dawoodi Bohra Community
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6">
              Your Community
              <span className="text-gold-400"> Marketplace</span>
            </h1>
            <p className="text-primary-100 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Discover authentic Bohra products — from handmade Rida and Topi to home-cooked
              Mithai and pickles — all from trusted community vendors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/shop"
                className="bg-gold-500 hover:bg-gold-600 text-white font-semibold px-8 py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
              >
                <ShoppingBag size={20} />
                Shop Now
              </Link>
              <Link
                href="/vendor-register"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg border border-white/20"
              >
                <Store size={20} />
                Become a Vendor
              </Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 px-4 bg-cream">
          <div className="max-w-6xl mx-auto">
            <h2 className="section-title text-center mb-10">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/shop?category=${cat.slug}`}
                  className="card p-6 text-center hover:shadow-md transition-all hover:-translate-y-1 group"
                >
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                    {cat.emoji}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{cat.name}</h3>
                  <p className="text-xs text-gray-500">{cat.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="section-title text-center mb-10">Why Bohra Market?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="text-center p-6">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon size={24} className="text-primary-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-display font-bold mb-4">
              Ready to start selling?
            </h2>
            <p className="text-primary-100 mb-8">
              Join hundreds of Bohra vendors already selling on our platform.
              Start with a free Basic plan — no credit card required.
            </p>
            <Link
              href="/vendor-register"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg"
            >
              Start Selling Today
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-primary-600 text-primary-200 py-8 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-display font-bold text-white text-lg">Bohra Market</p>
            <p className="text-sm">© 2025 Bohra Market. Built with ❤️ for the Dawoodi Bohra community.</p>
            <div className="flex gap-4 text-sm">
              <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
              <Link href="/vendor-register" className="hover:text-white transition-colors">Sell</Link>
              <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
