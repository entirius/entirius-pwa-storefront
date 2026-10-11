import Image from "next/image";
import { NavigationComponent } from "./navigation-component";
import { ThemeToggle } from "./theme-toggle";
import { WishlistSheet } from "./wishlist-sheet";
import { CartSheet } from "./cart-sheet";
import { AccountNav } from "./account-nav";
import { SearchSheet } from "./search-sheet";
import { LinkDynamic } from "@/lib/link-dynamic";
import { brand } from "@/_CONFIG/brand.config";

export function HeaderComponent() {
  return (
    <header className="sticky top-0 z-10 flex justify-between items-center px-4 h-14 border-b border-border bg-background">
      <LinkDynamic href="/" className="flex items-center gap-2">
        <Image src={brand.logo} alt={brand.name} className="h-8 w-auto" />
      </LinkDynamic>
      <div className="flex items-center gap-2">
        <NavigationComponent />
        <SearchSheet />
        <WishlistSheet />
        <CartSheet />
        <AccountNav />
        <ThemeToggle />
      </div>
    </header>
  );
}