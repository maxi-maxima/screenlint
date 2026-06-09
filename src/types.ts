export type IssueSeverity = 'error' | 'warning' | 'info';
export type ScanStatus = 'pass' | 'warn' | 'fail';

export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
}

export interface ViewportMetrics {
  bodyTextLength: number;
  documentWidth: number;
  horizontalOverflow: number;
  visibleElementCount: number;
}

export interface ViewportResult extends ViewportConfig {
  screenshotPath: string;
  metrics: ViewportMetrics;
}

export interface ScreenIssue {
  id: string;
  rule: string;
  severity: IssueSeverity;
  title: string;
  message: string;
  viewport: string;
  selector: string;
  help: string;
  evidence?: Record<string, string | number | boolean>;
}

export interface ScanSummary {
  issueCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  viewportCount: number;
}

export interface ScanResult {
  target: string;
  startedAt: string;
  finishedAt: string;
  status: ScanStatus;
  summary: ScanSummary;
  viewports: ViewportResult[];
  issues: ScreenIssue[];
}

export interface ScanOptions {
  target: string;
  outDir: string;
  viewports: ViewportConfig[];
  timeoutMs: number;
}
