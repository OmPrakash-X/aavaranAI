// ============================================================
// Session Model — Stores each agent interaction cycle
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

// ---- Sub-schemas ----
const BoundingBoxSchema = new Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
}, { _id: false });

const DetectionSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'face', 'password', 'email', 'phone', 'aadhaar', 'pan',
      'credit_card', 'name', 'address', 'dob', 'ip_address',
      'passport', 'vehicle_reg', 'organization', 'location', 'unknown',
    ],
  },
  bbox: { type: BoundingBoxSchema, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  detectedBy: {
    type: String,
    required: true,
    enum: ['dom', 'ocr', 'ner', 'mediapipe', 'dom_avatar'],
  },
  strategy: {
    type: String,
    required: true,
    enum: ['gaussian_blur', 'solid_fill', 'pixelate', 'char_mask'],
  },
}, { _id: false });

const ActionSchema = new Schema({
  action: {
    type: String,
    required: true,
    enum: ['click', 'type', 'press_key', 'scroll', 'select', 'hover', 'navigate', 'wait', 'done'],
  },
  selector: { type: String, default: null },
  value: { type: String, default: null },
  reasoning: { type: String, required: true },
  nextExpectation: { type: String, default: null },
  confidence: { type: Number, min: 0, max: 1 },
}, { _id: false });

const LatencySchema = new Schema({
  clientInference: { type: Number, default: 0 },   // ms — on-device AI pipeline
  serverRoundTrip: { type: Number, default: 0 },   // ms — VLM processing
  totalEndToEnd: { type: Number, default: 0 },      // ms — full cycle
}, { _id: false });

// ---- Main Session Schema ----
export interface ISession extends Document {
  sessionId: string;
  stepIndex: number;
  pageTitle: string;
  pageDomain: string;
  detections: typeof DetectionSchema[];
  totalDetections: number;
  redactionCoverage: number;
  action: typeof ActionSchema;
  latency: typeof LatencySchema;
  vlmProvider: string;
  screenshotRedacted?: string;   // base64 fallback (select:false)
  screenshotUrl?: string;        // Cloudinary CDN URL (preferred)
  domElementCount: number;
  memoryUsageMB: number;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    stepIndex: {
      type: Number,
      required: true,
      default: 0,
    },
    pageTitle: {
      type: String,
      required: true,
      trim: true,
    },
    pageDomain: {
      type: String,
      default: '',
      trim: true,
    },
    detections: {
      type: [DetectionSchema],
      default: [],
    },
    totalDetections: {
      type: Number,
      default: 0,
    },
    redactionCoverage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    action: {
      type: ActionSchema,
      required: true,
    },
    latency: {
      type: LatencySchema,
      default: () => ({}),
    },
    vlmProvider: {
      type: String,
      required: true,
      trim: true,
    },
    screenshotRedacted: {
      type: String,  // Base64 fallback — excluded from queries by default
      select: false,
    },
    screenshotUrl: {
      type: String,  // Cloudinary CDN URL — included in all queries
      default: null,
    },
    domElementCount: {
      type: Number,
      default: 0,
    },
    memoryUsageMB: {
      type: Number,
      default: 0,
    },
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'sessions',
    toJSON: {
      transform: (_doc: unknown, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        Reflect.deleteProperty(ret, '__v');
        return ret;
      },
    },
  }
);

// ---- Indexes for dashboard queries ----
SessionSchema.index({ createdAt: -1 });
SessionSchema.index({ sessionId: 1, stepIndex: 1 });
SessionSchema.index({ 'detections.type': 1 });
SessionSchema.index({ vlmProvider: 1 });

// ---- Prevent model recompilation in dev ----
export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
