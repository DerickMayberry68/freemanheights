ALTER TABLE public.opportunities
  ADD COLUMN contact_email TEXT CHECK (contact_email IS NULL OR length(contact_email) <= 254),
  ADD COLUMN contact_cc_email TEXT CHECK (contact_cc_email IS NULL OR length(contact_cc_email) <= 254),
  ADD COLUMN contact_phone TEXT CHECK (contact_phone IS NULL OR length(contact_phone) <= 50),
  ADD COLUMN contact_mailing_address TEXT CHECK (contact_mailing_address IS NULL OR length(contact_mailing_address) <= 1000),
  ADD COLUMN application_instructions TEXT CHECK (application_instructions IS NULL OR length(application_instructions) <= 3000),
  ADD CONSTRAINT opportunities_contact_cc_requires_email CHECK (contact_cc_email IS NULL OR contact_email IS NOT NULL);
