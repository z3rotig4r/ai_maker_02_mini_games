import { useEffect, useState } from 'react';
import { keyOutNearWhite } from '../utils/chroma';

// 캐시 맵 - 성능 최적화를 위해 처리된 이미지를 저장
const cache = new Map<string, string>();

/**
 * 스프라이트 이미지의 흰색/연한 회색 배경을 투명화하는 훅
 * @param src 원본 이미지 소스 URL
 * @param fuzz 흰색 근접도 (0-100, 기본값 22)
 * @returns 투명화된 이미지 URL 또는 원본 URL (처리 중이거나 실패한 경우)
 */
export function useChromaSprite(src: string, fuzz = 22): string {
  const [processedSrc, setProcessedSrc] = useState<string>(() => {
    // 캐시에서 먼저 확인
    return cache.get(src) ?? '';
  });

  useEffect(() => {
    let cancelled = false;

    const processImage = async () => {
      // 이미 캐시에 있으면 바로 반환
      if (cache.has(src)) {
        if (!cancelled) {
          setProcessedSrc(cache.get(src)!);
        }
        return;
      }

      try {
        // 크로마키 처리
        const processedUrl = await keyOutNearWhite(src, fuzz);
        
        if (!cancelled) {
          // 캐시에 저장
          cache.set(src, processedUrl);
          setProcessedSrc(processedUrl);
        }
      } catch (error) {
        console.warn('Failed to process sprite with chroma key:', error);
        if (!cancelled) {
          // 실패한 경우 원본 URL 사용
          setProcessedSrc(src);
        }
      }
    };

    processImage();

    return () => {
      cancelled = true;
    };
  }, [src, fuzz]);

  // 처리된 URL이 있으면 사용, 없으면 원본 사용
  return processedSrc || src;
}
