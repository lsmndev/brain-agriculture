import {
  ConsoleLogger,
  Injectable,
} from '@nestjs/common';
import {
  logs,
  SeverityNumber,
} from '@opentelemetry/api-logs';

@Injectable()
export class OtelLogger extends ConsoleLogger {
  private readonly otelLogger = logs.getLogger('brain-agriculture');

  log(message: unknown, ...optionalParams: unknown[]): void {
    super.log(message, ...optionalParams);

    this.emit(
      SeverityNumber.INFO,
      'INFO',
      message,
      optionalParams,
    );
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    super.warn(message, ...optionalParams);

    this.emit(
      SeverityNumber.WARN,
      'WARN',
      message,
      optionalParams,
    );
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    super.error(message, ...optionalParams);

    this.emit(
      SeverityNumber.ERROR,
      'ERROR',
      message,
      optionalParams,
    );
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    super.debug(message, ...optionalParams);

    this.emit(
      SeverityNumber.DEBUG,
      'DEBUG',
      message,
      optionalParams,
    );
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    super.verbose(message, ...optionalParams);

    this.emit(
      SeverityNumber.TRACE,
      'TRACE',
      message,
      optionalParams,
    );
  }

  private emit(
    severityNumber: SeverityNumber,
    severityText: string,
    message: unknown,
    optionalParams: unknown[],
  ): void {
    this.otelLogger.emit({
      severityNumber,
      severityText,
      body:
        typeof message === 'string'
          ? message
          : JSON.stringify(message),

      attributes: {
        'log.source': 'nestjs',
        'log.context': this.getContext(optionalParams),
      },
    });
  }

  private getContext(optionalParams: unknown[]): string {
    const context = optionalParams.at(-1);

    return typeof context === 'string'
      ? context
      : 'Application';
  }
}