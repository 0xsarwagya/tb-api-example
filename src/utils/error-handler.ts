const HTTP_STATUS_TIMEOUT = 408;

export async function handleHttpError(response: Response): Promise<never> {
  const errorText = await response.text().catch(() => "");
  const errorMessage = errorText
    ? `HTTP ${response.status}: ${response.statusText} - ${errorText}`
    : `HTTP ${response.status}: ${response.statusText}`;
  
  const error = new Error(errorMessage);
  (error as Error & { statusCode?: number }).statusCode = response.status;
  (error as Error & { isTimeout?: boolean }).isTimeout = response.status === HTTP_STATUS_TIMEOUT;
  
  throw error;
}

export function createErrorResponse(
  status: number,
  statusText: string,
  errorText?: string
): Error {
  const message = errorText
    ? `HTTP ${status}: ${statusText} - ${errorText}`
    : `HTTP ${status}: ${statusText}`;
  return new Error(message);
}