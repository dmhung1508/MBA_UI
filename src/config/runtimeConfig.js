const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function isIpv4(hostname) {
  const match = hostname.match(/^(\d{1,3})(\.\d{1,3}){3}$/);
  if (!match) {
    return false;
  }

  return hostname.split(".").every((segment) => {
    const value = Number(segment);
    return Number.isInteger(value) && value >= 0 && value <= 255;
  });
}

function isPrivateIpv4(hostname) {
  if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) {
    return true;
  }

  const match = hostname.match(/^172\.(\d+)\./);
  if (!match) {
    return false;
  }

  const secondOctet = Number(match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
}

function isCarrierGradeNatIpv4(hostname) {
  const match = hostname.match(/^100\.(\d+)\./);
  if (!match) {
    return false;
  }

  const secondOctet = Number(match[1]);
  return secondOctet >= 64 && secondOctet <= 127;
}

export function isLocalLikeHost(hostname) {
  if (!hostname) {
    return false;
  }

  return (
    LOCAL_HOSTNAMES.has(hostname) ||
    isPrivateIpv4(hostname) ||
    isCarrierGradeNatIpv4(hostname) ||
    isIpv4(hostname)
  );
}

export function resolveBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return import.meta.env.VITE_BASE_URL || "";
}

export function resolveApiBaseUrl() {
  const configuredBase = import.meta.env.VITE_API_BASE_URL || "";

  if (typeof window === "undefined" || !window.location?.hostname) {
    return configuredBase;
  }

  const { protocol, hostname } = window.location;
  if (!isLocalLikeHost(hostname)) {
    return configuredBase;
  }

  return `${protocol}//${hostname}:4559`;
}
