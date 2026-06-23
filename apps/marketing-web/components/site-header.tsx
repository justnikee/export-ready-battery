"use client";

import { useState, useEffect } from "react";
import AnnouncementBar from "./announcement-bar";
import Navbar from "./navbar";

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [showBar, setShowBar] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 44);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const collapsed = scrolled || !showBar;

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: collapsed ? 0 : 60, opacity: collapsed ? 0 : 1 }}
      >
        <AnnouncementBar onClose={() => setShowBar(false)} />
      </div>
      <Navbar fixed={false} />
    </header>
  );
}
