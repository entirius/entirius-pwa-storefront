"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, MapPin, Package } from "lucide-react";

import { client_logout } from "@/lib/auth-client";
import { useAuth } from "@/providers/auth.provider";
import { LinkDynamic } from "@/lib/link-dynamic";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { profile_query } from "../api.query";
import { ProfileEditForm } from "./profile-edit-form";

export function ProfileClient() {
  const { setLoggedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const { data: profile, isLoading } = useQuery(profile_query());

  const logout = () => {
    client_logout();
    setLoggedIn(false);
    const country = params?.customer_country as string | undefined;
    router.push(!country || country === "default" ? "/" : `/${country}`);
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <Spinner className="size-5" />
      </div>
    );
  }

  const name = profile
    ? `${profile.firstname} ${profile.lastname}`.trim()
    : "";

  return (
    <div className="flex flex-col gap-6 py-4">
      <h1 className="text-2xl font-bold">My account</h1>

      <section className="rounded-lg border border-border p-4">
        {editing && profile ? (
          <ProfileEditForm
            profile={profile}
            onCancel={() => setEditing(false)}
            onSaved={(p) => {
              queryClient.setQueryData(["profile"], p);
              setEditing(false);
            }}
          />
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              {name && <p className="text-lg font-medium">{name}</p>}
              <p className="text-sm text-muted-foreground">
                {profile?.email ?? "—"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </div>
        )}
      </section>

      <nav className="flex flex-col divide-y divide-border rounded-lg border border-border">
        <MenuLink
          href="/profile/addresses"
          icon={<MapPin className="size-4" />}
          label="Delivery addresses"
        />
        <MenuLink
          href="/profile/orders"
          icon={<Package className="size-4" />}
          label="My orders"
        />
      </nav>

      <Button variant="outline" onClick={logout}>
        Log out
      </Button>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <LinkDynamic
      href={href}
      className="flex items-center justify-between gap-3 p-4 hover:bg-accent"
    >
      <span className="flex items-center gap-3 text-sm">
        {icon}
        {label}
      </span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </LinkDynamic>
  );
}
