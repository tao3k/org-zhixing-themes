import { CirclesThreePlusIcon } from "@phosphor-icons/react/dist/csr/CirclesThreePlus";
import { FileLockIcon } from "@phosphor-icons/react/dist/csr/FileLock";
import { FlagCheckeredIcon } from "@phosphor-icons/react/dist/csr/FlagCheckered";
import { FlowArrowIcon } from "@phosphor-icons/react/dist/csr/FlowArrow";
import { GraphIcon } from "@phosphor-icons/react/dist/csr/Graph";
import { LightningIcon } from "@phosphor-icons/react/dist/csr/Lightning";
import { RobotIcon } from "@phosphor-icons/react/dist/csr/Robot";
import { SealCheckIcon } from "@phosphor-icons/react/dist/csr/SealCheck";
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/csr/ShieldCheck";
import { TerminalWindowIcon } from "@phosphor-icons/react/dist/csr/TerminalWindow";
import { UserFocusIcon } from "@phosphor-icons/react/dist/csr/UserFocus";

import type { PooFlowGraphNodeKind, PooFlowGraphObjectIdentity } from "../poo-flow/graphContract";

export interface PooFlowSemanticIconIdentity extends PooFlowGraphObjectIdentity {
  readonly kind: PooFlowGraphNodeKind;
  readonly label: string;
}

export interface PooFlowSemanticIconProps {
  readonly event: PooFlowSemanticIconIdentity;
}

function normalizedIdentity(event: PooFlowSemanticIconIdentity): string {
  return [event.objectForm, event.objectSubtype, event.definitionId, event.label]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function PooFlowSemanticIcon({ event }: PooFlowSemanticIconProps) {
  const identity = normalizedIdentity(event);
  const iconProps = {
    "aria-hidden": true,
    className: "poo-flow-semantic-icon__glyph",
    size: 24,
    weight: "duotone" as const,
  };

  if (event.kind === "composition") {
    return <CirclesThreePlusIcon {...iconProps} />;
  }

  if (event.kind === "evidence") {
    return identity.includes("proof") || identity.includes("verified") ? (
      <SealCheckIcon {...iconProps} />
    ) : (
      <FileLockIcon {...iconProps} />
    );
  }

  if (event.kind === "boundary") {
    return <FlagCheckeredIcon {...iconProps} />;
  }

  if (event.kind === "profile-instance") {
    if (identity.includes("human") || identity.includes("user")) {
      return <UserFocusIcon {...iconProps} />;
    }
    if (identity.includes("agent") || identity.includes("ai")) {
      return <RobotIcon {...iconProps} />;
    }
    if (identity.includes("runtime") || identity.includes("terminal")) {
      return <TerminalWindowIcon {...iconProps} />;
    }
    if (identity.includes("research")) {
      return <GraphIcon {...iconProps} />;
    }
    return <UserFocusIcon {...iconProps} />;
  }

  if (event.kind === "case") {
    if (
      identity.includes("qualification") ||
      identity.includes("policy") ||
      identity.includes("guard")
    ) {
      return <ShieldCheckIcon {...iconProps} />;
    }
    return <FlowArrowIcon {...iconProps} />;
  }

  return <LightningIcon {...iconProps} />;
}
