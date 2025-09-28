/**
 * 크로마키 유틸리티 - 흰색/연한 회색 배경을 투명화
 */

/**
 * 이미지에서 흰색 및 연한 회색 배경을 투명화
 * @param src 이미지 소스 URL
 * @param fuzz 흰색 근접도 (0-100, 기본값 22)
 * @returns 투명화된 이미지의 Data URL
 */
export async function keyOutNearWhite(src: string, fuzz = 22): Promise<string> {
  // 이미지 로드
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

  const w = img.naturalWidth;
  const h = img.naturalHeight;

  // 캔버스 생성
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // 이미지를 캔버스에 그리기
  ctx.drawImage(img, 0, 0);

  // 픽셀 데이터 가져오기
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // 흰색 임계값 계산
  const threshold = 255 - Math.floor((fuzz / 100) * 255);

  // 각 픽셀 처리
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // 흰색 근접도 체크
    const nearWhite = (r >= threshold && g >= threshold && b >= threshold);
    // 연한 회색/체커보드 체크 (#e6~#ff)
    const nearChecker = (r >= 230 && g >= 230 && b >= 230);
    
    if (nearWhite || nearChecker) {
      data[i + 3] = 0; // 알파를 0으로 설정 (투명화)
    }
  }

  // 수정된 픽셀 데이터를 캔버스에 다시 그리기
  ctx.putImageData(imageData, 0, 0);

  // PNG 형식으로 반환
  return canvas.toDataURL('image/png');
}
