export default function Footer() {
  return (
    <section className="bg-[#0f2f4f] py-20">
      {/* Desktop Footer */}
      <div className="hidden md:block">
        <div className="max-w-7xl ml-6 mr-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16 min-h-[200px]">
            {/* Logo Section */}
            <div className="flex-shrink-0 mr-12">
              <img
                src="/CES White Logo.webp"
                alt="CES Logo"
                className="h-32 w-auto"
              />
            </div>

            {/* Content Section */}
            <div className="flex-1 grid grid-cols-3 items-start text-white gap-8">
              {/* COLUMN 1 — Organization Info - Left */}
              <div className="min-w-0 flex justify-center">
                <div className="max-w-xs">
                  <h3 className="text-lg font-semibold mb-6">
                    The High School Chapter of<br />
                    Cleveland Engineering Society
                  </h3>
                  <p className="text-sm leading-relaxed mb-6">
                    PO Box 546<br />
                    Grand River, OH 44045
                  </p>

                  <p className="text-sm">
                    <a href="tel:4404629382" className="hover:underline">
                      440.462.9382
                    </a><br />
                    <a href="mailto:info@cesnet.org" className="hover:underline">
                      highschoolces@gmail.com
                    </a>
                  </p>
                </div>
              </div>

              {/* COLUMN 2 — Navigation - Exact Center */}
              <div className="min-w-0 flex justify-center">
                <div>
                  <h3 className="text-lg font-semibold mb-6">Explore</h3>
                  <ul className="space-y-5 text-sm">
                    <li>
                      <a
                        href="/about"
                        className="hover:underline"
                      >
                        About
                      </a>
                    </li>
                    <li>
                      <a
                        href="/signup"
                        className="hover:underline"
                      >
                        Signup
                      </a>
                    </li>
                    <li>
                      <a
                        href="/events"
                        className="hover:underline"
                      >
                        Events
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              {/* COLUMN 3 — Actions - Right */}
              <div className="min-w-0 flex justify-center">
                <div>
                  <h3 className="text-lg font-semibold mb-6">Member Access</h3>
                  <ul className="space-y-5 text-sm">
                    <li>
                      <a
                        href="/contact"
                        className="hover:underline"
                      >
                        Contact
                      </a>
                    </li>
                    <li>
                      <a
                        href="/login"
                        className="hover:underline"
                      >
                        Login
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      <div className="md:hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center space-y-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img
                src="/CES White Logo.webp"
                alt="CES Logo"
                className="h-24 w-auto"
              />
            </div>

            {/* Organization Info */}
            <div className="text-center text-white">
              <h3 className="text-lg font-semibold mb-4">
                The High School Chapter of<br />
                Cleveland Engineering Society
              </h3>
              <p className="text-sm leading-relaxed mb-4">
                PO Box 546<br />
                Grand River, OH 44045
              </p>
              <p className="text-sm">
                <a href="tel:4404629382" className="hover:underline">
                  440.462.9382
                </a><br />
                <a href="mailto:info@cesnet.org" className="hover:underline">
                  highschoolces@gmail.com
                </a>
              </p>
            </div>

            {/* Navigation Links */}
            <div className="text-center text-white">
              <h3 className="text-lg font-semibold mb-4">Explore</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="/about"
                    className="hover:underline"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="/signup"
                    className="hover:underline"
                  >
                    Signup
                  </a>
                </li>
                <li>
                  <a
                    href="/events"
                    className="hover:underline"
                  >
                    Events
                  </a>
                </li>
              </ul>
            </div>

            {/* Member Access */}
            <div className="text-center text-white">
              <h3 className="text-lg font-semibold mb-4">Member Access</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="/contact"
                    className="hover:underline"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="/login"
                    className="hover:underline"
                  >
                    Login
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}