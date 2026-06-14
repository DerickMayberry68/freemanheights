-- Cover connection card foreign keys used for church scoping and staff assignment.

CREATE INDEX idx_connection_submissions_church_id
  ON public.connection_submissions(church_id);

CREATE INDEX idx_connection_submissions_assigned_to
  ON public.connection_submissions(assigned_to)
  WHERE assigned_to IS NOT NULL;
