import Image from "next/image";
import Link from "next/link";
import React from "react";

const Navbar = () => {
  return (
    <nav className="border-b border-border bg-white px-6 py-4 z-20 relative">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link href="https://sukruthakeralam.com" rel="noopener noreferrer">
          <Image
            src="/images/logo.png"
            alt="Sukrutha Logo"
            width={100}
            height={100}
          />
        </Link>
      <a
          href="https://sukruthakeralam.com"
          className="text-sm text-muted-foreground hover:text-foreground"
          target="_blank"
          rel="noopener noreferrer"
        >
          Main Site
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
