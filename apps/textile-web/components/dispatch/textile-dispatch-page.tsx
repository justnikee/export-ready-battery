"use client";

import { useState, useRef, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Scan,
  Truck,
  CheckCircle,
  AlertCircle,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface ScannedItem {
  id: string;
  rawValue: string;
  timestamp: Date;
  error?: string;
  failed?: boolean;
}

export default function TextileDispatchPage() {
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = async (value: string) => {
    if (!value.trim() || isProcessing) return;

    setIsProcessing(true);
    const trimmed = value.trim();

    try {
      // Attempt to dispatch the lot via API
      await api.post("/passports/transition", {
        serial_number: trimmed,
        action: "SHIP",
      });

      const item: ScannedItem = {
        id: crypto.randomUUID(),
        rawValue: trimmed,
        timestamp: new Date(),
      };

      setScannedItems((prev) => [item, ...prev]);
      toast.success(`Lot ${trimmed} dispatched`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const item: ScannedItem = {
        id: crypto.randomUUID(),
        rawValue: trimmed,
        timestamp: new Date(),
        error: err.response?.data?.error || "Dispatch failed",
        failed: true,
      };
      setScannedItems((prev) => [item, ...prev]);
      toast.error(item.error);
    } finally {
      setInputValue("");
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleScan(inputValue);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full mx-auto space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl text-foreground tracking-tight">Lot Dispatch</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scan lot QR codes to record shipments and track dispatch status
          </p>
        </div>

        {/* Scan Input */}
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Scan className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Scan Lot QR Code
              </label>
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scan or enter lot serial number..."
                className="w-full"
                disabled={isProcessing}
              />
            </div>
            <Button
              onClick={() => handleScan(inputValue)}
              disabled={!inputValue.trim() || isProcessing}
              className="mt-6"
            >
              {isProcessing ? (
                <span className="animate-spin mr-2">⟳</span>
              ) : (
                <Truck className="w-4 h-4 mr-2" />
              )}
              Dispatch
            </Button>
          </div>
        </Card>

        {/* Scanned Items */}
        {scannedItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Recent Dispatches ({scannedItems.length})
            </h2>
            {scannedItems.map((item) => (
              <Card
                key={item.id}
                className={`p-4 flex items-center gap-3 ${
                  item.failed ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"
                }`}
              >
                {item.failed ? (
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {item.rawValue}
                    </span>
                  </div>
                  {item.error && (
                    <p className="text-xs text-red-500 mt-0.5">{item.error}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {item.timestamp.toLocaleTimeString()}
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
