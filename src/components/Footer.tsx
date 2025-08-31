// components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white py-6 mt-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        <div>
          <h3 className="font-bold text-lg mb-2">Quick Links</h3>
          <ul className="text-sm space-y-1">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li><Link href="/about" className="hover:underline">About</Link></li>
            <li><Link href="/services" className="hover:underline">Services</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-2">Contact</h3>
          <p className="text-sm">📍 Lahore, Pakistan</p>
          <p className="text-sm">📞 +92-333-0500-177</p>
          <p className="text-sm">📧 contact@pakistantoplawyers.com</p>
        </div>
      </div>
      <div className="text-center text-xs mt-4">
        © {new Date().getFullYear()} Pakistan&apos;s Top Lawyers. All rights reserved.
      </div>
    </footer>
  );
}
