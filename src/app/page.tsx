import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* FULL-WIDTH STRIPE */}
        <section className="w-full bg-[#00539eff] py-12">
          <div className="max-w-5xl mx-auto px-12 text-center">
            <h2 className="text-white text-4xl md:text-5xl font-bold">
              LEARN. CONNECT. LEAD.
            </h2>
          <p className="text-white/90 text-sm md:text-base mt-3">
          We are the High School Student Division of CES, a non-profit professional 
          organization of over 500 members connecting Northeast Ohio’s engineering and 
          technology community to share experience, expertise, and innovation.
        </p>
        <p className="text-white/90 text-sm md:text-base mt-3">
        Cleveland Engineering Society was created with the intention of fostering the exchange of information and intellectual ideas to advance
         the development of the region and we support programs that build upon our region’s profound technical center 
         and contribute to economic growth.
         </p>
      </div>
    </section>
    
    <section className="w-full py-16">
      <div className="text-[#00539eff] max-w-5xl mx-auto px-6 relative">
        {/* Top-right header */}
          <h2 className="absolute top-0 right-6 text-4xl font-bold tracking-wide">
          EVENTS
        </h2>

        {/* Section content */}
          <div className="pt-10">
        {/* your events content here */}
      </div>
    </div>
    </section>

    <section className="relative w-full bg-[#f59e0b] py-20 overflow-hidden">
  {/* TEXT CONTENT */}
  <div className="relative z-20 max-w-5xl mx-auto px-6 text-left">
    <h2 className="text-white text-3xl font-bold mb-2 w-full">
      OUR MISSION
    </h2>
    <p className="text-white text-2xl  translate-y-10 w-full">
      To help students explore real-world STEM careers through mentorship,
      hands-on learning, and connections with professionals.
    </p>
  </div>
</section>

<section className="bg-[#0f2f4f] py-16">
  <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 text-white">

    {/* COLUMN 1 — Organization Info */}
    <div>
      <h3 className="text-lg font-semibold mb-4">
        The High School Chapter of Cleveland Engineering Society
      </h3>
      <p className="text-sm leading-relaxed">
        PO Box 546<br />
        Grand River, OH 44045
      </p>

      <p className="text-sm mt-4">
        <a href="tel:4404629382" className="hover:underline">
          440.462.9382
        </a><br />
        <a href="mailto:info@cesnet.org" className="hover:underline">
          highschoolces@gmail.com
        </a>
      </p>
    </div>

    {/* COLUMN 2 — Navigation */}
    <div>
      <h3 className="text-lg font-semibold mb-4 md:ml-20">Explore</h3>
      <ul className="space-y-5 text-sm md:ml-20">
        <li><a href="/about" className="hover:underline">About Us</a></li>
        <li><a href="/get-involved" className="hover:underline">Signup</a></li>
        <li><a href="/news-events" className="hover:underline">Events</a></li>
      </ul>
    </div>

    {/* COLUMN 3 — Actions */}
    <div>
      <h3 className="text-lg font-semibold mb-4">Member Access</h3>
      <ul className="space-y-5 text-sm">
        <li><a href="/contact" className="hover:underline">Contact</a></li>
        <li><a href="/login" className="hover:underline">Login</a></li>
      </ul>
    </div>

  </div>
</section>


    </>
  );
}
