export abstract class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable: boolean
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, false);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string) {
    super('RATE_LIMIT_ERROR', message, true);
  }
}

export class TimeoutError extends AppError {
  constructor(message: string) {
    super('TIMEOUT_ERROR', message, true);
  }
}

export class DependencyDownError extends AppError {
  constructor(message: string) {
    super('DEPENDENCY_DOWN_ERROR', message, true);
  }
}

export class DataQualityError extends AppError {
  constructor(message: string) {
    super('DATA_QUALITY_ERROR', message, false);
  }
}

export class AgentExecutionError extends AppError {
  constructor(message: string) {
    super('AGENT_EXECUTION_ERROR', message, false);
  }
}
