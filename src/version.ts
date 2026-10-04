declare const __APP_VERSION__: string;
declare const __GIT_HASH__: string;
declare const __BUILD_DATE__: string;

export const APP_VERSION  = __APP_VERSION__;
export const GIT_HASH     = __GIT_HASH__;
export const BUILD_DATE   = __BUILD_DATE__;
export const BUILD_LABEL  = `v${APP_VERSION} (${GIT_HASH}) · ${BUILD_DATE}`;
