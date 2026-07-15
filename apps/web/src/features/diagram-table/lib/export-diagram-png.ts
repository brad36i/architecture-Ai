/** data URL 이미지를 PNG blob으로 변환 후 다운로드 */
export function downloadDataUrlAsPng(dataUrl: string, filename: string): void {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.toLowerCase().endsWith('.png') ? filename : `${filename}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  img.onerror = () => {};
  img.src = dataUrl;
}

export function sanitizeDiagramExportBasename(title: string): string {
  const t = title.replace(/\s+/g, ' ').trim() || 'diagram';
  return (
    t
      .replace(/[/\\?%*:|"<>]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'diagram'
  );
}
