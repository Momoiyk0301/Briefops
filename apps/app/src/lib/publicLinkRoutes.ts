function trimBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

export function buildSharePath(token: string) {
  return `/briefing/share/${token}`;
}

export function buildShareUrl(baseUrl: string, token: string) {
  return `${trimBaseUrl(baseUrl)}${buildSharePath(token)}`;
}

// Legacy builders kept for backward compatibility with existing shared links
export function buildStaffBriefingPath(token: string) {
  return `/briefings/s/${token}`;
}

export function buildAudienceBriefingPath(briefingId: string, audienceTag: string, token: string) {
  return `/briefings/${briefingId}/${audienceTag}/${token}`;
}

export function buildStaffBriefingUrl(baseUrl: string, token: string) {
  return `${trimBaseUrl(baseUrl)}${buildStaffBriefingPath(token)}`;
}

export function buildAudienceBriefingUrl(baseUrl: string, briefingId: string, audienceTag: string, token: string) {
  return `${trimBaseUrl(baseUrl)}${buildAudienceBriefingPath(briefingId, audienceTag, token)}`;
}
