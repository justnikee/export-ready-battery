"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Download, FileKey2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { getPassportVC, issuePassportVC } from "@/lib/api/vcs";
import { downloadPassportVC, isIssuedVC, vcErrorMessage } from "@/lib/passport-vc";
import { canWrite } from "@/lib/rbac";

interface PassportVCActionsProps {
  uuid: string;
  serialNumber: string;
}

export function PassportVCActions({ uuid, serialNumber }: PassportVCActionsProps) {
  const { user } = useAuth();
  const canIssue = canWrite(user?.role);
  const [busy, setBusy] = useState<"issue" | "download" | null>(null);
  const [issued, setIssued] = useState(false);

  async function onIssue() {
    if (!canIssue) return;
    setBusy("issue");
    try {
      const res = await issuePassportVC(uuid);
      downloadPassportVC(serialNumber, res.vc);
      if (isIssuedVC(res.status)) {
        setIssued(true);
        toast.success("Verifiable credential issued and downloaded");
      } else {
        toast.warning(
          "Downloaded an unsigned draft — VC signing is not configured on this server",
        );
      }
    } catch (err) {
      toast.error(vcErrorMessage(err, "Failed to issue credential"));
    } finally {
      setBusy(null);
    }
  }

  async function onDownload() {
    setBusy("download");
    try {
      const res = await getPassportVC(uuid);
      downloadPassportVC(serialNumber, res.vc);
      if (isIssuedVC(res.status)) setIssued(true);
      toast.success("Credential downloaded");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        toast.error("No stored credential yet. Use Issue VC to create one.");
      } else {
        toast.error(vcErrorMessage(err, "Failed to download credential"));
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="inline-flex items-center justify-end gap-2">
      {issued && (
        <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-500">
          Issued
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            disabled={busy !== null}
            aria-label={`Credential actions for ${serialNumber}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {canIssue && (
            <DropdownMenuItem onClick={onIssue} disabled={busy !== null}>
              <FileKey2 className="mr-2 h-4 w-4" />
              {issued ? "Re-issue VC" : "Issue VC"}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onDownload} disabled={busy !== null}>
            <Download className="mr-2 h-4 w-4" />
            Download VC
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
