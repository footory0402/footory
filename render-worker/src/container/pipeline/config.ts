/** 렌더 파이프라인 공통 설정 */

// 출력 해상도 (720p — 모바일 최적, 용량 ~50% 절감)
export const OUTPUT_W = 1280;
export const OUTPUT_H = 720;

// FFmpeg 인코딩 설정
export const CODEC = "libx264";
export const PRESET = "fast";
export const CRF = "23";
export const AUDIO_CODEC = "aac";
export const AUDIO_BITRATE = "128k";

// 시네마틱 레터박스 높이 (비례 조정: 1080→60px, 720→40px)
export const LETTERBOX_H = 40;
