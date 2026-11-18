import { ChevronDown } from "lucide-react";
import { useRef } from "react";

import { useCurrentUser } from "@/auth/context";
import { describeRole, initials } from "@/auth/roles";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Who you're acting as, and the "View as" list to change it: one control. */
export function UserMenu() {
  const { me, personas, switchingTo, switchPersona } = useCurrentUser();
  const trigger = useRef<HTMLButtonElement>(null);
  const pickedWithPointer = useRef(false);
  const role = describeRole(me);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        ref={trigger}
        className="ml-auto flex shrink-0 items-center gap-2.5 rounded-lg px-2 py-1 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Avatar aria-hidden>
          <AvatarFallback>{initials(me.name)}</AvatarFallback>
          <AvatarBadge className="bg-status-active" />
        </Avatar>
        <span className="leading-tight whitespace-nowrap">
          <span className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {switchingTo ? "Switching to" : "Viewing as"}
          </span>{" "}
          <span className="block text-[14px] font-semibold">
            {switchingTo ? (
              `${switchingTo.name}…`
            ) : (
              <>
                {me.name}
                {/* The role drops on narrow screens so the name never wraps; the menu lists it. */}
                <span className="hidden lg:inline"> ({role})</span>
              </>
            )}
          </span>
        </span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64"
        onPointerDown={() => (pickedWithPointer.current = true)}
        onKeyDown={() => (pickedWithPointer.current = false)}
        onCloseAutoFocus={(event) => {
          // Focus still returns to the button, but a mouse or touch choice doesn't leave a
          // keyboard focus ring behind on it.
          if (!pickedWithPointer.current) return;
          event.preventDefault();
          trigger.current?.focus({ focusVisible: false } as FocusOptions);
        }}
      >
        <DropdownMenuLabel>View as</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={me.id} onValueChange={(id) => void switchPersona(id)}>
          {personas.map((persona) => (
            <DropdownMenuRadioItem key={persona.id} value={persona.id}>
              <span className="leading-tight">
                <span className="block">{persona.name}</span>
                <span className="block text-[12px] text-muted-foreground">
                  {describeRole(persona)}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
