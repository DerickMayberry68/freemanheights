-- Update staff images
-- This migration updates the image URL for the pastor

-- Update Pastor's image
UPDATE staff
SET image_url = '/images/lanny.jpg'
WHERE role ILIKE '%pastor%' OR name ILIKE '%lanny%';
