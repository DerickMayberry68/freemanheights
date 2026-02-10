-- Update ministry images
-- This migration updates the image URLs for all ministries

-- Update Kids/Children's Ministry
UPDATE ministries
SET image_url = '/images/Childrens-Ministry.png'
WHERE name ILIKE '%kid%' OR name ILIKE '%children%';

-- Update Student/Youth Ministry
UPDATE ministries
SET image_url = '/images/cheerful-group-of-preteen-children-raising-their-hands-and-making-playful-gestures-photo.jpg'
WHERE name ILIKE '%student%' OR name ILIKE '%youth%' OR name ILIKE '%teen%';

-- Update Adult Ministry
UPDATE ministries
SET image_url = '/images/adults.jpg'
WHERE name ILIKE '%adult%';

-- Update Awanas Ministry
UPDATE ministries
SET image_url = '/images/OIP.jpeg'
WHERE name ILIKE '%awana%';

-- Update Women's Ministry
UPDATE ministries
SET image_url = '/images/women.png'
WHERE name ILIKE '%women%' OR name ILIKE '%ladies%';

-- Update Men's Ministry
UPDATE ministries
SET image_url = '/images/mensministrymountains.jpg'
WHERE name ILIKE '%men%' OR name ILIKE '%mens%';
