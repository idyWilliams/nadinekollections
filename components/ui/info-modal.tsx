"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "success" | "error" | "info";
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function InfoModal({
    isOpen,
    onClose,
    type,
    title,
    message,
    actionLabel = "Close",
    onAction,
}: InfoModalProps) {
    const handleAction = () => {
        if (onAction) {
            onAction();
        }
        onClose();
    };

    const getIcon = () => {
        switch (type) {
            case "success":
                return <CheckCircle className="h-12 w-12 text-green-500" />;
            case "error":
                return <AlertCircle className="h-12 w-12 text-red-500" />;
            case "info":
            default:
                return <Info className="h-12 w-12 text-blue-500" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <div className="flex flex-col items-center text-center gap-4 py-4">
                    {getIcon()}
                    <DialogHeader>
                        <DialogTitle className="text-xl text-center">{title}</DialogTitle>
                        <DialogDescription className="text-base mt-2">
                            {message}
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <DialogFooter className="sm:justify-center">
                    <Button type="button" onClick={handleAction} className="min-w-[100px]">
                        {actionLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
