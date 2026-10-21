"use client";

import Link from "next/link";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, avatarInitials } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/actions";

// Replaces the bare email string that used to sit in the dashboard header.
// Identity, the two account routes, and sign-out in one affordance.
export function UserMenu({
  email,
  fullName,
}: {
  email: string;
  fullName: string | null;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2.5 text-sm transition hover:bg-accent data-[state=open]:bg-accent">
        <Avatar>
          <AvatarFallback>{avatarInitials(fullName, email)}</AvatarFallback>
        </Avatar>
        {/* The name is the useful label; the email is in the menu itself, so
            narrow headers drop the text and keep just the avatar. */}
        <span className="hidden max-w-[12rem] truncate font-medium sm:block">
          {fullName || email}
        </span>
        <Icon icon={ChevronDown} size="sm" className="text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[15rem]">
        <DropdownMenuLabel>
          <span className="block truncate text-sm font-semibold text-foreground">
            {fullName || "Your account"}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <Icon icon={User} size="sm" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Icon icon={Settings} size="sm" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* A form post, so sign-out survives JS being unavailable and clears
            the auth cookies on the server response. */}
        <form action={signOut}>
          <DropdownMenuItem
            destructive
            asChild
            onSelect={(e) => e.preventDefault()}
          >
            <button type="submit" className="w-full">
              <Icon icon={LogOut} size="sm" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
