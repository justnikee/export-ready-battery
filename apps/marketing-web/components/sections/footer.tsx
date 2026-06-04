import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Battery", href: "/battery" },
    { label: "Textile", href: "/textile" },
    { label: "Pricing", href: "/pricing" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "Documentation", href: "/docs" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Contact", href: "/contact" },
  ],
};

export default function Footer() {
  return (
    <footer className="pt-16 pb-9 bg-[#f6f9fc] border-t border-[#e3e8ee]">
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-8 md:gap-11 mb-12">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#0d253d] text-sm font-semibold"
            >
              <span
                className="w-4 h-4 rounded-[5px]"
                style={{
                  background: "linear-gradient(135deg, #533afd, #ea2261)",
                  transform: "skewX(-10deg)",
                  boxShadow: "rgba(83,58,253,.26) 0 8px 18px",
                }}
              />
              Anviora
            </Link>
            <p className="max-w-[230px] mt-3 text-[13px] leading-[1.5] text-[#64748d]">
              Digital product passports and compliance infrastructure for Indian
              exporters.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-[13px] font-medium text-[#0d253d] mb-3">
                {category}
              </h4>
              <ul className="space-y-1.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[12px] leading-[1.9] text-[#64748d] hover:text-[#0d253d] transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#e3e8ee] pt-5 text-[12px] text-[#64748d]">
          <span>© 2026 Anviora. All rights reserved.</span>
          <div className="flex items-center gap-6 mt-3 sm:mt-0">
            <a href="#" className="hover:text-[#0d253d] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#0d253d] transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
