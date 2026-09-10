// ============================================================
// API Types — Request/Response interfaces for all endpoints
// ============================================================

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---- PII Detection Types ----
export type PIIType =
  | 'face'
  | 'password'
  | 'email'
  | 'phone'
  | 'aadhaar'
  | 'pan'
  | 'credit_card'
  | 'name'
  | 'address'
  | 'dob'
  | 'ip_address'
  | 'passport'
  | 'vehicle_reg'
  | 'organization'
  | 'location'
  | 'unknown';

export type DetectionLayer = 'dom' | 'ocr' | 'ner' | 'mediapipe';

export type RedactionStrategy =
  | 'gaussian_blur'
  | 'solid_fill'
  | 'pixelate'
  | 'char_mask';

export interface Detection {
  type: PIIType;
  bbox: BoundingBox;
  confidence: number;
  detectedBy: DetectionLayer;
  rawText?: string;
}

export interface RedactionEntry {
  type: PIIType;
  bbox: BoundingBox;
  strategy: RedactionStrategy;
  confidence: number;
  detectedBy: DetectionLayer;
}

// ---- DOM Element Types ----
export interface DOMElement {
  id: string;
  tag: string;
  type: string | null;
  text: string;
  placeholder: string | null;
  ariaLabel: string | null;
  role: string | null;
  name: string | null;
  value: string | null;
  href: string | null;
  autocomplete: string | null;
  isDisabled: boolean;
  isChecked: boolean | null;
  selector: string;
  bbox: BoundingBox;
}

// ---- Action Types ----
export type ActionType =
  | 'click'
  | 'type'
  | 'press_key'
  | 'scroll'
  | 'select'
  | 'hover'
  | 'navigate'
  | 'wait'
  | 'done';

export interface AgentAction {
  action: ActionType;
  selector: string;
  value: string | null;
  reasoning: string;
  nextExpectation: string;
  confidence?: number;
}

// ---- API Request/Response ----
export interface AnalyzeRequest {
  screenshot: string;          // Base64 redacted PNG (high-res for VLM)
  thumbnail?: string;         // Lightweight Base64 thumbnail (~25KB for dashboard storage)
  domElements: DOMElement[];
  redactionManifest: RedactionEntry[];
  userTask: string;
  pageTitle: string;
  sessionId: string;
  clientLatency?: number;
  screenClassification?: {
    screenType: string;
    description: string;
    confidence: number;
    device?: string;
    latency?: number;
  } | null;
}

export interface AnalyzeResponse {
  action: AgentAction;
  sessionId: string;
  latency: number;
  provider: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  providers: {
    gemini: boolean;
    mistral: boolean;
  };
  database: boolean;
  uptime: number;
  timestamp: string;
}

export interface MetricsResponse {
  totalSessions: number;
  totalDetections: number;
  avgLatency: number;
  avgDetectionsPerSession: number;
  piiBreakdown: Record<PIIType, number>;
  providerUsage: Record<string, number>;
  recentSessions: SessionSummary[];
}

export interface SessionSummary {
  _id: string;
  sessionId: string;
  pageTitle: string;
  totalDetections: number;
  action: AgentAction;
  latency: number;
  provider: string;
  createdAt: string;
}
