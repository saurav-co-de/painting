export async function readJsonResponse(response, fallbackMessage = "Request failed.") {
  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();

  if (!body.trim()) {
    return response.ok ? {} : { error: fallbackMessage };
  }

  if (!contentType.includes("application/json")) {
    return response.ok ? {} : { error: body || fallbackMessage };
  }

  try {
    return JSON.parse(body);
  } catch {
    return response.ok ? {} : { error: fallbackMessage };
  }
}
