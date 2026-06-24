export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class NetworkError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class RateLimitError extends ServiceError {
  constructor(message: string = 'Rate limit exceeded (429)') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends ServiceError {
  constructor(message: string = 'Authentication failed (401/403)') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class DataValidationError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'DataValidationError';
  }
}

export class ResourceNotFoundError extends ServiceError {
  constructor(message: string = 'Resource not found (404)') {
    super(message);
    this.name = 'ResourceNotFoundError';
  }
}

export class DependencyDownError extends ServiceError {
  constructor(message: string = 'Upstream dependency is down (5xx)') {
    super(message);
    this.name = 'DependencyDownError';
  }
}
