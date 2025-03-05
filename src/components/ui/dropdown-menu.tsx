"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("mx-1 my-1 h-px bg-indigo-100 dark:bg-indigo-800/30", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuContent = React.forwardRef(
  (
    { className, sideOffset = 4, ...props }: 
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & { sideOffset?: number }, 
    ref: React.ForwardedRef<React.ElementRef<typeof DropdownMenuPrimitive.Content>>
  ) => {
    return (
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          className={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-xl border bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-2 text-popover-foreground shadow-lg border-indigo-100 dark:border-indigo-800/30",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
          )}
          {...props}
        />
      </DropdownMenuPrimitive.Portal>
    )
  }
)

const DropdownMenuItem = React.forwardRef(
  (
    { className, inset, ...props }: 
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { inset?: boolean }, 
    ref: React.ForwardedRef<React.ElementRef<typeof DropdownMenuPrimitive.Item>>
  ) => {
    return (
      <DropdownMenuPrimitive.Item
        ref={ref}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors focus:bg-indigo-50 dark:focus:bg-indigo-900/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 focus:text-gray-900 dark:focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          inset && "pl-8",
          className
        )}
        {...props}
      />
    )
  }
)

const DropdownMenuLabel = React.forwardRef(
  (
    { className, inset, ...props }: 
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }, 
    ref: React.ForwardedRef<React.ElementRef<typeof DropdownMenuPrimitive.Label>>
  ) => {
    return (
      <DropdownMenuPrimitive.Label
        ref={ref}
        className={cn(
          "px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 flex items-center",
          inset && "pl-8",
          className
        )}
        {...props}
      />
    )
  }
)

DropdownMenuContent.displayName = 'DropdownMenuContent'
DropdownMenuItem.displayName = 'DropdownMenuItem'
DropdownMenuLabel.displayName = 'DropdownMenuLabel'
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuPortal
}