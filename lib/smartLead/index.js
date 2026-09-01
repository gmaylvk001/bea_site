export {
  STORAGE_KEY,
  SCORE_POINTS,
  SCORE_EVENT_KEYS,
  CLASSIFICATION,
  TIMING_MS,
  PREMIUM_PRICE_THRESHOLD,
} from "./constants.js";

export { isPremiumProduct, getEffectiveProductPrice } from "./premium.js";

export {
  classifyIntentScore,
  applyScoreEvent,
  buildAwardKey,
  getScoreBreakdown,
  withScoreRuntimeConfig,
} from "./scoreEngine.js";

export {
  createEmptyVisitorState,
  readVisitorState,
  writeVisitorState,
  bootstrapVisitorState,
  normalizeProductContext,
  toLastViewedProduct,
} from "./storage.js";

export {
  recordPageVisit,
  recordProductView,
  tickEngagement,
  setMobileNumberCaptured,
  setPopupInteraction,
  setBrowseContext,
  setTalkToId,
  getVisitorIntentSnapshot,
} from "./tracker.js";

export { POPUP_TYPES, POPUP_TRIGGER_MS, POPUP_MIN_SCORE } from "./popupTypes.js";
export {
  selectPopupType,
  detectPageType,
  resolveSameCategoryCount,
  resolveLastViewedProduct,
} from "./popupDecision.js";
export {
  buildPopupContent,
  buildCategoryPopupContent,
  buildModelPopupContent,
  buildComparisonPopupContent,
  buildPremiumPopupContent,
  resolveExpertType,
} from "./popupContent.js";

export {
  HIGH_INTENT_EXCEPTION_SCORE,
  HELP_OPTIONS,
  createDefaultPopupState,
  resetPopupStateForNewSession,
  canShowLeadPopup,
  getPopupDisplayMode,
  isValidIndianMobile,
  normalizeIndianMobile,
} from "./frequency.js";

export {
  markLeadPopupShown,
  markLeadPopupClosed,
  markMobileCaptured,
  markSupportPopupShown,
  markHelpSelection,
} from "./popupFrequencyActions.js";

export {
  SMART_LEAD_CONFIG_KEY,
  getDefaultSmartLeadConfig,
  CONTENT_PLACEHOLDERS,
  DESIGN_TEMPLATES,
} from "./configDefaults.js";

export {
  resolveSmartLeadConfig,
  validateSmartLeadConfigInput,
  applyContentPlaceholders,
  resolveProductIsPremium,
  toPublicSmartLeadConfig,
} from "./configResolve.js";

export {
  DEFAULT_WHATSAPP_E164,
  FLOAT_WHATSAPP_E164,
  getConfiguredWhatsAppPhone,
  buildSmartLeadWhatsAppUrl,
} from "./whatsapp.js";

export {
  resolveTalkToId,
  syncTalkToAttributes,
  cacheTalkToId,
  discoverTalkToId,
} from "./talkToBridge.js";
