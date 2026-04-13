export type FeedbackSeverity = "success" | "error" | "info";

export interface UiFeedback {
  severity: FeedbackSeverity;
  message: string;
}

export const DEFAULT_REQUEST_ERROR_MESSAGE =
  "We could not complete that request right now. Please try again.";
