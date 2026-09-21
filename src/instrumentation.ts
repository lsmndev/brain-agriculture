import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]:
    process.env.OTEL_SERVICE_NAME ?? 'brain-agriculture',

  [ATTR_SERVICE_VERSION]:
    process.env.npm_package_version ?? '0.0.1',
});

const traceExporter = new OTLPTraceExporter({
  url:
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
    'http://otel-collector:4318/v1/traces',
});

const metricExporter = new OTLPMetricExporter({
  url:
    process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ??
    'http://otel-collector:4318/v1/metrics',
});

const logExporter = new OTLPLogExporter({
  url:
    process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT ??
    'http://otel-collector:4318/v1/logs',
});

const logRecordProcessor = new BatchLogRecordProcessor({
  exporter: logExporter,
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 10_000,
});

const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  logRecordProcessors: [logRecordProcessor],
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
});

sdk.start();

const shutdown = async (): Promise<void> => {
  try {
    await sdk.shutdown();
  } catch (error) {
    console.error('Error shutting down OpenTelemetry SDK', error);
  }
};

process.once('SIGTERM', () => {
  void shutdown();
});

process.once('SIGINT', () => {
  void shutdown();
});