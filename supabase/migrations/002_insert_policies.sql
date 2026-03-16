-- INSERT/UPDATE/DELETE ポリシー（anon keyでもデータ投入可能にする）
CREATE POLICY "Anon insert" ON listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update" ON listings FOR UPDATE USING (true);
CREATE POLICY "Anon insert" ON listing_sources FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert" ON subsidies FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update" ON subsidies FOR UPDATE USING (true);
