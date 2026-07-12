import type {
  OrgizeAgendaViewResponseDto,
  OrgizeAttachmentInventoryResponseDto,
  OrgizeLintResponseDto,
  OrgizeMemoryResponseDto,
  OrgizeSectionIndexResponseDto,
  OrgizeViewIndexResponseDto,
} from "orgize/dto";
import type { AgendaSettings } from "../config";

/** Raw generated-manifest source descriptor; validated at the static I/O boundary. */
export type StaticSourceSummary = {
  id: string;
  name: string;
  orgTitle?: string;
  file: string;
  sourceFile: string;
  sourceBytes: number;
  shardPath?: string;
  agendaShardPath?: string;
  attachmentShardPath?: string;
  memoryShardPath?: string;
  sectionShardPath?: string;
};

/** Raw generated source-shard DTO; semantic consumers project it into domain views. */
export type StaticSourceProjection = {
  id: string;
  name: string;
  orgTitle?: string;
  file: string;
  sourceFile: string;
  sourceBytes: number;
  agendaRange?: AgendaSettings;
  agendaShardPath?: string;
  viewIndex: OrgizeViewIndexResponseDto;
  sectionIndex?: OrgizeSectionIndexResponseDto;
  sectionShardPath?: string;
  html: string;
  attachmentInventory?: OrgizeAttachmentInventoryResponseDto;
  attachmentShardPath?: string;
  memory?: OrgizeMemoryResponseDto;
  memoryShardPath?: string;
  agendaView?: OrgizeAgendaViewResponseDto;
  lint: OrgizeLintResponseDto;
};
