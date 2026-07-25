import { Badge } from "@/components/ui/badge";
import { PayoutStatus } from "@/lib/types";
import {
  CheckCircle2,
  Clock,
  ShieldAlert,
  XCircle,
} from "lucide-react";

export function StatusPill({ status }: { status: PayoutStatus }) {
  switch (status) {
    case "Executed":
      return (
        <Badge variant="success">
          <CheckCircle2 className="size-3" /> Executed
        </Badge>
      );
    case "Pending Approval":
      return (
        <Badge variant="warning">
          <Clock className="size-3" /> Pending Approval
        </Badge>
      );
    case "Policy Blocked":
      return (
        <Badge variant="destructive">
          <ShieldAlert className="size-3" /> Policy Blocked
        </Badge>
      );
    case "Rejected":
      return (
        <Badge variant="muted">
          <XCircle className="size-3" /> Rejected
        </Badge>
      );
    default:
      return <Badge variant="muted">{status}</Badge>;
  }
}
