import i18n from "@/i18n";
import { AppErrorCode, isAppErrorCode } from "@/lib/errorCodes";

export function getErrorMessage(errorCode: unknown) {
  const code: AppErrorCode = isAppErrorCode(errorCode) ? errorCode : "UNKNOWN_ERROR";
  const translated = i18n.t(`errors.${code}`, { defaultValue: "" });
  return translated || i18n.t("errors.UNKNOWN_ERROR");
}

export function getErrorCodeFromUnknown(error: unknown): AppErrorCode {
  if (typeof error === "object" && error !== null) {
    if ("errorCode" in error && isAppErrorCode((error as { errorCode?: unknown }).errorCode)) {
      return (error as { errorCode: AppErrorCode }).errorCode;
    }
    if ("message" in error && isAppErrorCode((error as { message?: unknown }).message)) {
      return (error as { message: AppErrorCode }).message;
    }
  }
  if (isAppErrorCode(error)) return error;
  return "UNKNOWN_ERROR";
}
