/** Saves bytes as a file. The link is attached while clicked and the URL kept alive a moment: some browsers drop the download otherwise. */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Shares a file where the browser can (phones, some desktops); otherwise shares the text, and as a
 * last resort downloads the file. A cancelled share sheet is not an error.
 */
export async function shareFile(blob: Blob, fileName: string, title: string, text?: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], fileName, { type: blob.type });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title, text });
      return 'shared';
    }
    if (navigator.share && text) {
      await navigator.share({ title, text });
      return 'shared';
    }
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError') return 'shared';
  }
  saveBlob(blob, fileName);
  return 'downloaded';
}

/** Loads an image (local or a CORS-enabled CDN) as a data URL for a PDF; null if it can't be read. */
export async function imageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

