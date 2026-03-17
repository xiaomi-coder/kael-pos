-- Security Definer to bypass usual constraints and get database size.
-- Returns the database size in MB (rounded to 2 decimal places).
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  db_size numeric;
BEGIN
  -- pg_database_size returns bytes, we divide by 1024*1024 for MB
  SELECT pg_database_size(current_database()) / 1048576.0 INTO db_size;
  RETURN ROUND(db_size, 2);
END;
$$;

-- Allow authenticated and anon roles to execute this function
GRANT EXECUTE ON FUNCTION get_database_size() TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_database_size() TO anon;
GRANT EXECUTE ON FUNCTION get_database_size() TO authenticated;
