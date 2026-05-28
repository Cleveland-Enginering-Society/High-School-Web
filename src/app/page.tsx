'use client';

// Written by Evan Dan


import Image from 'next/image';
import HomeEventsSection from '@/components/home/HomeEventsSection';
import TourRequestsPreview from '@/components/home/TourRequestsPreview';

export default function Home() {
  return (
    <>
      <section className="w-full bg-[#00539eff] py-16 md:py-24 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-14">
            <div className="flex-1 min-w-0">
              <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold font-kanit leading-tight">
                LEARN. CONNECT. LEAD.
              </h1>
              <div className="mt-8 md:mt-10 space-y-5 text-white/90 text-base md:text-lg font-kanit leading-relaxed">
                <p>
                  We are the High School Student Division of CES, a non-profit professional
                  organization of over 500 members connecting Northeast Ohio&apos;s engineering and
                  technology community to share experience, expertise, and innovation.
                </p>
                <p>
                  Cleveland Engineering Society was created with the intention of fostering the
                  exchange of information and intellectual ideas to advance the development of the
                  region and we support programs that build upon our region&apos;s profound technical
                  center and contribute to economic growth.
                </p>
              </div>
              <div className="mt-10 md:mt-12">
                <p className="text-white/80 text-sm font-kanit mb-3">
                  This chapter is part of the Cleveland Engineering Society, our parent organization.
                </p>
                <a
                  href="https://www.cesnet.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-8 py-3 bg-white text-[#00539eff] font-semibold rounded hover:bg-white/90 transition-colors"
                >
                  Visit the CES Website →
                </a>
              </div>
            </div>

            <div className="w-full lg:w-[28rem] xl:w-[34rem] shrink-0">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg shadow-lg">
                <Image
                  src="/cleveland.jpg"
                  alt="Cleveland skyline"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 544px"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeEventsSection />
      <TourRequestsPreview />

      <section className="w-full bg-[#f59e0b] py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <h2 className="font-kanit text-white text-3xl md:text-4xl font-bold mb-4">
            OUR MISSION
          </h2>
          <p className="font-kanit text-white text-xl md:text-2xl leading-relaxed max-w-3xl">
            To help students explore real-world STEM careers through mentorship, hands-on
            learning, and connections with professionals.
          </p>
        </div>
      </section>
    </>
  );
}
