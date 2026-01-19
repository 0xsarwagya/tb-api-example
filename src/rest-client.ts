import type {
  RestApiClientConfig,
  EntityType,
  FetchTelemetryOptions,
  TelemetryTimeseries,
} from "./types";
import { handleHttpError } from "./utils/error-handler";
import { PROTOCOL_HTTPS, PROTOCOL_HTTP } from "./utils/constants";

const AUTH_ENDPOINT = "/api/auth/login";
const TOKEN_FIELD = "token";

export class ThingsBoardRestClient {
  private readonly baseUrl: string;
  private readonly username?: string;
  private readonly password?: string;
  private readonly deviceAccessToken?: string;
  private jwtToken: string | null = null;

  constructor(config: RestApiClientConfig) {
    const protocol = config.useHttps !== false ? PROTOCOL_HTTPS : PROTOCOL_HTTP;
    this.baseUrl = `${protocol}://${config.host}`;
    this.username = config.username;
    this.password = config.password;
    this.deviceAccessToken = config.deviceAccessToken;
    
    if (config.jwtToken) {
      this.jwtToken = config.jwtToken;
    }
  }

  private buildAuthUrl(): string {
    return `${this.baseUrl}${AUTH_ENDPOINT}`;
  }

  private createAuthBody(): string {
    return JSON.stringify({
      username: this.username,
      password: this.password,
    });
  }

  private extractToken(data: { token?: string }): string {
    if (!data.token) {
      throw new Error("No token received from authentication");
    }
    return data.token;
  }

  private hasCredentials(): boolean {
    return !!this.username && !!this.password;
  }

  private usesDeviceAccessToken(): boolean {
    return !!this.deviceAccessToken;
  }

  private async authenticate(): Promise<string> {
    if (this.jwtToken) {
      return this.jwtToken;
    }

    if (this.usesDeviceAccessToken()) {
      throw new Error(
        "Device access tokens are not supported for REST API. " +
        "REST API requires user authentication (username/password or JWT token). " +
        "Device access tokens are only for HTTP Device API (/api/v1/{accessToken}/...). " +
        "Please use TB_USERNAME/TB_PASSWORD or TB_JWT_TOKEN instead."
      );
    }

    if (!this.hasCredentials()) {
      throw new Error(
        "Authentication required: provide username/password or jwtToken. " +
        "Device access tokens cannot be used with REST API."
      );
    }

    const response = await fetch(this.buildAuthUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: this.createAuthBody(),
    });

    if (!response.ok) {
      await handleHttpError(response);
    }

    const data = (await response.json()) as { token?: string };
    this.jwtToken = this.extractToken(data);
    return this.jwtToken;
  }

  private buildAuthHeader(token: string): string {
    if (this.usesDeviceAccessToken()) {
      return token;
    }
    return `Bearer ${token}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.authenticate();
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.usesDeviceAccessToken()) {
      headers["X-Authorization"] = token;
    } else {
      headers["X-Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      await handleHttpError(response);
    }

    return response.json() as Promise<T>;
  }

  async getTelemetryKeys(
    entityType: EntityType,
    entityId: string
  ): Promise<string[]> {
    return this.request<string[]>(
      `/api/plugins/telemetry/${entityType}/${entityId}/keys/timeseries`
    );
  }

  private buildTelemetryEndpoint(
    entityType: EntityType,
    entityId: string
  ): string {
    return `/api/plugins/telemetry/${entityType}/${entityId}`;
  }

  private buildKeysQueryParam(keys: string[]): string {
    return encodeURIComponent(keys.join(","));
  }

  async getLatestTelemetry(
    entityType: EntityType,
    entityId: string,
    keys: string[]
  ): Promise<TelemetryTimeseries> {
    const baseEndpoint = this.buildTelemetryEndpoint(entityType, entityId);
    const keysParam = this.buildKeysQueryParam(keys);
    const endpoint = `${baseEndpoint}/values/timeseries?keys=${keysParam}`;

    return this.request<TelemetryTimeseries>(endpoint);
  }

  private buildQueryParams(options: FetchTelemetryOptions): URLSearchParams {
    const params = new URLSearchParams();
    params.append("keys", options.keys.join(","));

    if (options.startTs !== undefined) {
      params.append("startTs", options.startTs.toString());
    }
    if (options.endTs !== undefined) {
      params.append("endTs", options.endTs.toString());
    }
    if (options.interval !== undefined) {
      params.append("interval", options.interval.toString());
    }
    if (options.agg) {
      params.append("agg", options.agg);
    }
    if (options.limit !== undefined) {
      params.append("limit", options.limit.toString());
    }

    return params;
  }

  async fetchTelemetry(options: FetchTelemetryOptions): Promise<TelemetryTimeseries> {
    const baseEndpoint = this.buildTelemetryEndpoint(
      options.entityType,
      options.entityId
    );
    const params = this.buildQueryParams(options);
    const endpoint = `${baseEndpoint}/values/timeseries?${params.toString()}`;

    return this.request<TelemetryTimeseries>(endpoint);
  }

  logout(): void {
    if (!this.username && !this.password) {
      return;
    }
    this.jwtToken = null;
  }
}