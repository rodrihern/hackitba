/**
 * Validates and parses social media video URLs
 */

export interface ParsedVideoUrl {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'other';
  videoId: string | null;
  isValid: boolean;
}

/**
 * Validates if a URL is a valid social media video link
 */
export function isValidVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    
    // Check if it matches common social media video patterns
    const patterns = [
      /instagram\.com\/(p|reel|tv)\/[\w-]+/i,
      /tiktok\.com\/@[\w.-]+\/video\/\d+/i,
      /youtube\.com\/watch\?v=[\w-]+/i,
      /youtu\.be\/[\w-]+/i,
      /youtube\.com\/shorts\/[\w-]+/i,
    ];
    
    return patterns.some(pattern => pattern.test(url));
  } catch {
    return false;
  }
}

/**
 * Parses a video URL and extracts platform and video ID
 */
export function parseVideoUrl(url: string): ParsedVideoUrl {
  if (!url) {
    return { platform: 'other', videoId: null, isValid: false };
  }

  try {
    const urlObj = new URL(url);
    
    // Instagram
    if (urlObj.hostname.includes('instagram.com')) {
      const match = url.match(/instagram\.com\/(p|reel|tv)\/([\w-]+)/i);
      if (match) {
        return {
          platform: 'instagram',
          videoId: match[2],
          isValid: true,
        };
      }
    }
    
    // TikTok
    if (urlObj.hostname.includes('tiktok.com')) {
      const match = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/i);
      if (match) {
        return {
          platform: 'tiktok',
          videoId: match[1],
          isValid: true,
        };
      }
    }
    
    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = null;
      
      // youtube.com/watch?v=VIDEO_ID
      if (urlObj.pathname === '/watch') {
        videoId = urlObj.searchParams.get('v');
      }
      // youtu.be/VIDEO_ID
      else if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      }
      // youtube.com/shorts/VIDEO_ID
      else if (urlObj.pathname.startsWith('/shorts/')) {
        videoId = urlObj.pathname.split('/')[2];
      }
      
      if (videoId) {
        return {
          platform: 'youtube',
          videoId,
          isValid: true,
        };
      }
    }
    
    // Valid URL but not a recognized platform
    return {
      platform: 'other',
      videoId: null,
      isValid: true,
    };
  } catch {
    return {
      platform: 'other',
      videoId: null,
      isValid: false,
    };
  }
}

/**
 * Gets a human-readable platform name
 */
export function getPlatformName(platform: ParsedVideoUrl['platform']): string {
  const names: Record<ParsedVideoUrl['platform'], string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    other: 'Other Platform',
  };
  return names[platform];
}

/**
 * Gets an icon name for the platform (for use with lucide-react)
 */
export function getPlatformIcon(platform: ParsedVideoUrl['platform']): string {
  const icons: Record<ParsedVideoUrl['platform'], string> = {
    instagram: 'Instagram',
    tiktok: 'Music', // TikTok icon not in lucide, use Music as alternative
    youtube: 'Youtube',
    other: 'Video',
  };
  return icons[platform];
}
