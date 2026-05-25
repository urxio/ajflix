-- Run this in your Supabase SQL editor

-- Videos table
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  genre text,
  duration int,
  views int default 0,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table videos enable row level security;

-- Public can read all videos
create policy "Public read" on videos
  for select using (true);

-- Only authenticated users (admin) can insert/update/delete
create policy "Admin insert" on videos
  for insert with check (auth.role() = 'authenticated');

create policy "Admin update" on videos
  for update using (auth.role() = 'authenticated');

create policy "Admin delete" on videos
  for delete using (auth.role() = 'authenticated');

-- Increment views function (called from server action)
create or replace function increment_views(video_id uuid)
returns void as $$
  update videos set views = views + 1 where id = video_id;
$$ language sql security definer;

-- Storage buckets
insert into storage.buckets (id, name, public) values ('videos', 'videos', true);
insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', true);

-- Storage policies
create policy "Public video read" on storage.objects for select using (bucket_id = 'videos');
create policy "Admin video upload" on storage.objects for insert with check (bucket_id = 'videos' and auth.role() = 'authenticated');
create policy "Admin video delete" on storage.objects for delete using (bucket_id = 'videos' and auth.role() = 'authenticated');
create policy "Public thumbnail read" on storage.objects for select using (bucket_id = 'thumbnails');
create policy "Admin thumbnail upload" on storage.objects for insert with check (bucket_id = 'thumbnails' and auth.role() = 'authenticated');
create policy "Admin thumbnail delete" on storage.objects for delete using (bucket_id = 'thumbnails' and auth.role() = 'authenticated');
