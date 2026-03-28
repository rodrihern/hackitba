-- Add video_url column to challenge_submissions
ALTER TABLE challenge_submissions
ADD COLUMN video_url TEXT;

-- Add video_url column to exchange_applications
ALTER TABLE exchange_applications
ADD COLUMN video_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN challenge_submissions.video_url IS 'URL to the video posted by creator (Instagram, TikTok, YouTube, etc.)';
COMMENT ON COLUMN exchange_applications.video_url IS 'URL to the video/content posted by creator for the exchange';
