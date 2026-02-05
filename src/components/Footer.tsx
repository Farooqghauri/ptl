"use client";
// components/Footer.tsx
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-blue-950 text-blue-50 mt-12" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/loggo.png" alt="PTL logo" width={40} height={40} className="rounded-sm" />
              <span className="text-lg font-extrabold tracking-tight">Pakistan&apos;s Top Lawyers</span>
            </Link>
            <p className="mt-3 text-sm text-blue-200 leading-relaxed max-w-xs">
              Powerful AI tools for legal drafting, research, translation, and case summarization in Pakistan.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link aria-label="Follow on Twitter" href="https://twitter.com" className="hover:text-white transition">𝕏</Link>
              <Link aria-label="Follow on Facebook" href="https://facebook.com" className="hover:text-white transition">f</Link>
              <Link aria-label="Follow on LinkedIn" href="https://linkedin.com" className="hover:text-white transition">in</Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-blue-200 uppercase">Quick Links</h3>
            <ul className="mt-4 text-sm grid grid-cols-2 gap-x-4 gap-y-2 sm:block sm:space-y-2">
              <li><Link className="hover:text-white transition" href="/">Home</Link></li>
              <li><Link className="hover:text-white transition" href="/about">About</Link></li>
              <li><Link className="hover:text-white transition" href="/services">Services</Link></li>
              <li><Link className="hover:text-white transition" href="/lawyers">Lawyers</Link></li>
              <li><Link className="hover:text-white transition" href="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-blue-200 uppercase">Legal</h3>
            <ul className="mt-4 text-sm grid grid-cols-2 gap-x-4 gap-y-2 sm:block sm:space-y-2">
              <li><Link className="hover:text-white transition" href="/privacy">Privacy Policy</Link></li>
              <li><Link className="hover:text-white transition" href="/terms">Terms of Service</Link></li>
              <li><Link className="hover:text-white transition" href="/cookies">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-blue-200 uppercase">Stay Updated</h3>
            <p className="mt-4 text-sm text-blue-200">Get news, legal tips, and platform updates.</p>
            <form className="mt-4 flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="newsletter-email" className="sr-only">Email</label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="contact@pakistantoplawyers.com"
                className="w-full rounded-md px-3 py-2 text-blue-950 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <button
                type="submit"
                className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-500 transition-colors"
                aria-label="Subscribe to newsletter"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-2 text-xs text-blue-300">We respect your privacy. Unsubscribe anytime.</p>
          </div>
        </div>

        <div className="mt-10 border-t border-blue-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-300">
          <p>(c) {new Date().getFullYear()} Pakistan&apos;s Top Lawyers. All rights reserved.</p>
          <p className="text-[11px]">Powered by PTL AI Legal Suite.</p>
        </div>
      </div>
    </footer>
  );
}
