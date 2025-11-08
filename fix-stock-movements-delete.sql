-- Run ONLY this command in Supabase SQL Editor
-- This is the missing DELETE policy for stock_movements

CREATE POLICY "Authenticated users can delete stock movements" ON stock_movements
  FOR DELETE USING (auth.role() = 'authenticated');
