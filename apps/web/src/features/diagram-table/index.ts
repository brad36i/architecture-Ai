export { DiagramArtifactCards } from "./ui/diagram-artifact-cards"
export { DiagramChatPanel } from "./ui/diagram-chat-panel"
export { DraftPreview } from "./ui/draft-preview"
export { DiagramTypeCards } from "./ui/diagram-type-cards"
export { getMockDraft, MOCK_ARTIFACTS } from "./model/mock"
export {
  buildGeneratedPreview,
  buildIllustrationContent,
  DIAGRAM_PROMPT_PRESETS,
  extractMethodologyContent,
  fetchIllustrationChatHistory,
  fetchIllustrationChatStream,
  fetchIllustrationSessions,
  getDiagramPromptPreset,
  mapHistoryToChatMessages,
  mapIllustrationHistoryToArtifacts,
  mapPresetToVisualType,
  pickLatestIllustrationSessionId,
} from "./model/illustration-stream"
export type { DiagramArtifact, DiagramDraft, DiagramTypeItem } from "./model/mock"
export type {
  DiagramChatMessage,
  DiagramPromptPresetId,
  DiagramStreamProgress,
  GeneratedDiagramPreview,
  IllustrationChatHistoryItem,
  IllustrationSessionId,
  IllustrationSessionRow,
  IllustrationVisualType,
} from "./model/illustration-stream"
export {
  DEFAULT_MAX_CRITIC_ROUNDS,
  maxCriticRoundsSchema,
  parseMaxCriticRoundsInput,
} from "./model/illustration-chat-schema"
