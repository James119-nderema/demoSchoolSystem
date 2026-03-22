/**
 * Shared image loading utility for PDF report generation.
 * Centralised here so the logo is fetched once and reused across all students.
 */

/**
 * Fetch a remote image and return it as a base64 data-URI string.
 * Returns `null` on any network / read failure so callers can degrade gracefully.
 */
export const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

/**
 * Pre-fetch the school logo once.
 * Handles the PythonAnywhere → Vercel proxy rewrite automatically.
 */
export const prefetchLogo = async (
  logoUrl: string | undefined | null
): Promise<string | null> => {
  if (!logoUrl) return null;

  // Proxy PythonAnywhere logo through Vercel to bypass CORS
  let url = logoUrl;
  if (
    url.includes(
      '185.181.10.160:8000/media/school_logos/Screenshot_2026-01-24_08_17_15_PlOmrtG.png'
    )
  ) {
    url = '/api/proxy-logo';
  }

  return loadImageAsBase64(url);
};
