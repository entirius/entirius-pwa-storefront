"use client";
import Link from "next/link";
import { useParams } from "next/navigation";

export function LinkDynamic({
  href,
  children,
  ...props
}: React.ComponentProps<typeof Link>) {
  const params = useParams();
  const country = params?.customer_country as string | undefined;

  const prefixedHref =
    !country || country === "default"
      ? href
      : `/${country}${href}`;

  return (
    <Link href={prefixedHref} {...props}>
      {children}
    </Link>
  );
}
