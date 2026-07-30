import Image from "next/image";
import { NavigationComponent } from "./navigation-component";
import { ThemeToggle } from "./theme-toggle";
import { WishlistSheet } from "./wishlist-sheet";
import { CartSheet } from "./cart-sheet";
import { AccountNav } from "./account-nav";
import { SearchSheet } from "./search-sheet";
import { LinkDynamic } from "@/lib/link-dynamic";

export function HeaderComponent() {
  return (
    <header className="sticky top-0 z-10 flex justify-between items-center px-4 h-14 border-b border-border bg-background">
      <LinkDynamic href="/" className="flex items-center gap-2">
        <Image src="/next.svg" alt="Logo" width={100} height={100} />
        <span className="text-2xl font-bold text-foreground">Ecommerce</span>
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