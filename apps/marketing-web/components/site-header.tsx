"use client";

import Navbar from "./navbar";

export default function SiteHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <Navbar fixed={false} />
    </header>
  );
}
