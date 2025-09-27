// src/utils/iconUtils.ts
import { MATERIALS_MAP } from '../data/materials';

// 개발 편의용 아이콘 404 경고
export const validateIconPath = (iconPath: string, materialId?: string) => {
  if (process.env.NODE_ENV === 'development') {
    const img = new Image();
    img.onerror = () => {
      console.warn(`[Icon Warning] 아이콘을 찾을 수 없습니다: ${iconPath}${materialId ? ` (materialId: ${materialId})` : ''}`);
    };
    img.src = iconPath;
  }
};

// MATERIALS_MAP에서 아이콘 경로 가져오기
export const getMaterialIcon = (materialId: keyof typeof MATERIALS_MAP): string => {
  const material = MATERIALS_MAP[materialId];
  if (!material) {
    console.warn(`[Icon Warning] 알 수 없는 재료 ID: ${materialId}`);
    return '/assets/icons/placeholder.png'; // 기본 아이콘
  }
  
  // 개발 모드에서 아이콘 경로 검증
  validateIconPath(material.icon, materialId);
  
  return material.icon;
};

// 모든 재료 아이콘 경로 검증 (개발 모드에서만)
export const validateAllIcons = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Icon Validation] 모든 재료 아이콘 경로 검증 중...');
    Object.entries(MATERIALS_MAP).forEach(([id, material]) => {
      validateIconPath(material.icon, id);
    });
  }
};
