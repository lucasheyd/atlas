"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef(
  function AlertDialogOverlayComponent(
    { className, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>, 
    ref: React.ForwardedRef<React.ElementRef<typeof AlertDialogPrimitive.Overlay>>
  ) {
    return (
      <AlertDialogPrimitive.Overlay
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          className
        )}
        {...props}
      />
    )
  }
)
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef(
  function AlertDialogContentComponent(
    { className, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>, 
    ref: React.ForwardedRef<React.ElementRef<typeof AlertDialogPrimitive.Content>>
  ) {
    return (
      <AlertDialogPortal>
        <AlertDialogOverlay />
        <AlertDialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] md:w-full dark:bg-gray-900",
            className
          )}
          {...props}
        />
      </AlertDialogPortal>
    )
  }
)
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef(
  function AlertDialogTitleComponent(
    { className, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>, 
    ref: React.ForwardedRef<React.ElementRef<typeof AlertDialogPrimitive.Title>>
  ) {
    return (
      <AlertDialogPrimitive.Title
        ref={ref}
        className={cn(
          "text-lg font-semibold text-gray-900 dark:text-white",
          className
        )}
        {...props}
      />
    )
  }
)
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef(
  function AlertDialogDescriptionComponent(
    { className, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>, 
    ref: React.ForwardedRef<React.ElementRef<typeof AlertDialogPrimitive.Description>>
  ) {
    return (
      <AlertDialogPrimitive.Description
        ref={ref}
        className={cn(
          "text-sm text-gray-500 dark:text-gray-400",
          className
        )}
        {...props}
      />
    )
  }
)
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

const AlertDialogCancel = React.forwardRef(
  function AlertDialogCancelComponent(
    { className, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>, 
    ref: React.ForwardedRef<React.ElementRef<typeof AlertDialogPrimitive.Cancel>>
  ) {
    const outlineButtonClasses = "border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md"
    
    return (
      <AlertDialogPrimitive.Cancel
        ref={ref}
        className={cn(
          outlineButtonClasses,
          "mt-2 sm:mt-0",
          className
        )}
        {...props}
      />
    )
  }
)
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

const AlertDialogAction = React.forwardRef(
  function AlertDialogActionComponent(
    { className, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>, 
    ref: React.ForwardedRef<React.ElementRef<typeof AlertDialogPrimitive.Action>>
  ) {
    const defaultButtonClasses = "bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
    
    return (
      <AlertDialogPrimitive.Action
        ref={ref}
        className={cn(
          defaultButtonClasses,
          "mt-2 sm:mt-0",
          className
        )}
        {...props}
      />
    )
  }
)
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
}