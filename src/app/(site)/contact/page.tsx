export const metadata = {
  title: "Contact Pakistan's Top Lawyers",
  description:
    "Get in touch with Pakistan's Top Lawyers. Contact us for legal consultations, queries, and lawyer connections.",
};

export default function Contact() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-blue-900 mb-4">Contact Us</h1>
      <p className="text-gray-700 mb-6">
        Have questions or need a lawyer? Fill out the form below or reach us through our contact details.
      </p>

      <form className="space-y-4 max-w-lg">
        <input
          type="text"
          placeholder="Your Name"
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
        <input
          type="email"
          placeholder="Your Email"
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
        <textarea
          placeholder="Your Message"
          rows={5}
          className="w-full border border-gray-300 rounded px-4 py-2"
        ></textarea>
        <button
          type="submit"
          className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800"
        >
          Send Message
        </button>
      </form>
    </main>
  );
}
