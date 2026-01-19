import type {
  ThingsBoardClientConfig,
  TelemetryData,
  TelemetryDataWithTimestamp,
  Attributes,
  AttributeUpdateResponse,
  RpcRequest,
  RpcResponse,
  ClaimDeviceRequest,
  ProvisionDeviceRequest,
  FirmwareRequestParams,
} from "./types";
import { handleHttpError } from "./utils/error-handler";
import { PROTOCOL_HTTPS, PROTOCOL_HTTP, DEFAULT_TIMEOUT_MS } from "./utils/constants";

const HTTP_STATUS_NO_CONTENT = 204;
const CONTENT_LENGTH_HEADER = "content-length";

export class ThingsBoardClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;

  constructor(config: ThingsBoardClientConfig) {
    const protocol = config.useHttps !== false ? PROTOCOL_HTTPS : PROTOCOL_HTTP;
    this.baseUrl = `${protocol}://${config.host}`;
    this.accessToken = config.accessToken;
  }

  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}/api/v1/${this.accessToken}${endpoint}`;
  }

  private isEmptyResponse(response: Response): boolean {
    return (
      response.status === HTTP_STATUS_NO_CONTENT ||
      response.headers.get(CONTENT_LENGTH_HEADER) === "0"
    );
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      await handleHttpError(response);
    }

    if (this.isEmptyResponse(response)) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  async publishTelemetry(
    data: TelemetryData | TelemetryData[] | TelemetryDataWithTimestamp
  ): Promise<void> {
    await this.request<void>("/telemetry", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async publishAttributes(attributes: Attributes): Promise<void> {
    await this.request<void>("/attributes", {
      method: "POST",
      body: JSON.stringify(attributes),
    });
  }

  private buildAttributesQueryString(
    clientKeys?: string[],
    sharedKeys?: string[]
  ): string {
    const params = new URLSearchParams();
    if (clientKeys && clientKeys.length > 0) {
      params.append("clientKeys", clientKeys.join(","));
    }
    if (sharedKeys && sharedKeys.length > 0) {
      params.append("sharedKeys", sharedKeys.join(","));
    }
    return params.toString();
  }

  async requestAttributes(
    clientKeys?: string[],
    sharedKeys?: string[]
  ): Promise<AttributeUpdateResponse> {
    const queryString = this.buildAttributesQueryString(clientKeys, sharedKeys);
    const endpoint = queryString ? `/attributes?${queryString}` : "/attributes";

    return this.request<AttributeUpdateResponse>(endpoint, {
      method: "GET",
    });
  }

  async subscribeToAttributeUpdates(
    timeoutMs: number = DEFAULT_TIMEOUT_MS
  ): Promise<AttributeUpdateResponse | null> {
    try {
      return await this.request<AttributeUpdateResponse>(
        `/attributes/updates?timeout=${timeoutMs}`,
        {
          method: "GET",
        }
      );
    } catch (error) {
      if (this.isTimeoutError(error)) {
        return null;
      }
      throw error;
    }
  }

  private isTimeoutError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    
    const errorWithStatus = error as Error & { statusCode?: number; isTimeout?: boolean };
    return (
      errorWithStatus.isTimeout === true ||
      errorWithStatus.statusCode === 408 ||
      error.message.toLowerCase().includes("timeout")
    );
  }

  async subscribeToRpc(
    timeoutMs: number = DEFAULT_TIMEOUT_MS
  ): Promise<RpcRequest | null> {
    try {
      return await this.request<RpcRequest>(`/rpc?timeout=${timeoutMs}`, {
        method: "GET",
      });
    } catch (error) {
      if (this.isTimeoutError(error)) {
        return null;
      }
      throw error;
    }
  }

  async respondToRpc(requestId: number | string, response: RpcResponse): Promise<void> {
    await this.request<void>(`/rpc/${requestId}`, {
      method: "POST",
      body: JSON.stringify(response),
    });
  }

  async sendRpcRequest(request: RpcRequest): Promise<RpcResponse> {
    return this.request<RpcResponse>("/rpc", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async claimDevice(claimRequest?: ClaimDeviceRequest): Promise<void> {
    const body = claimRequest || {};
    await this.request<void>("/claim", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  private buildProvisionUrl(): string {
    return `${this.baseUrl}/api/v1/provision`;
  }

  async provisionDevice(provisionRequest: ProvisionDeviceRequest): Promise<void> {
    const url = this.buildProvisionUrl();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(provisionRequest),
    });

    if (!response.ok) {
      await handleHttpError(response);
    }
  }

  private buildFirmwareUrl(title: string, version: string): string {
    const encodedTitle = encodeURIComponent(title);
    const encodedVersion = encodeURIComponent(version);
    return `${this.baseUrl}/api/v1/${this.accessToken}/firmware?title=${encodedTitle}&version=${encodedVersion}`;
  }

  async downloadFirmware(params: FirmwareRequestParams): Promise<Blob> {
    const url = this.buildFirmwareUrl(params.title, params.version);
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      await handleHttpError(response);
    }

    return response.blob();
  }
}