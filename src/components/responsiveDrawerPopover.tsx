"use client";
import * as React from "react";

import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

import { DialogTriggerProps } from "@radix-ui/react-Dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "./ui/drawer";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";

export function DrawerDialog({
    open,
    onOpenChange,
    children,
}: {
    open?: boolean;
    children: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
}) {


    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                {children}
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            {children}
        </Drawer>
    );
}

export const DrawerDialogTrigger = React.forwardRef(function DrawerDialogTrigger(
    { children, ...props }: { children: React.ReactNode } & DialogTriggerProps,
    ref: React.ForwardedRef<HTMLButtonElement>
) {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (isDesktop) {
        return (
            <DialogTrigger ref={ref} {...props}>
                {children}
            </DialogTrigger>
        );
    }

    return (
        <DrawerTrigger ref={ref} {...props}>
            {children}
        </DrawerTrigger>
    );
});

export function DrawerDialogContent({ children }: { children: React.ReactNode }) {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (isDesktop) {
        return <DialogContent>{children}</DialogContent>;
    }

    return <DrawerContent className="p-5">{children}</DrawerContent>;
}
