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

-- Likes and dislikes columns
alter table videos add column if not exists likes int default 0;
alter table videos add column if not exists dislikes int default 0;

-- Shows table
create table if not exists shows (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  thumbnail_url text,
  genre text,
  created_at timestamptz default now()
);

alter table shows enable row level security;

create policy "Public read shows" on shows for select using (true);
create policy "Admin insert shows" on shows for insert with check (auth.role() = 'authenticated');
create policy "Admin update shows" on shows for update using (auth.role() = 'authenticated');
create policy "Admin delete shows" on shows for delete using (auth.role() = 'authenticated');

-- Episodes table
create table if not exists episodes (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references shows(id) on delete cascade,
  season int not null default 1,
  episode int not null,
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  duration int,
  created_at timestamptz default now()
);

alter table episodes enable row level security;

create policy "Public read episodes" on episodes for select using (true);
create policy "Admin insert episodes" on episodes for insert with check (auth.role() = 'authenticated');
create policy "Admin update episodes" on episodes for update using (auth.role() = 'authenticated');
create policy "Admin delete episodes" on episodes for delete using (auth.role() = 'authenticated');


-- Increment views function (called from server action)
create or replace function increment_views(video_id uuid)
returns void as $$
  update videos set views = views + 1 where id = video_id;
$$ language sql security definer;

-- Trailers table
create table if not exists trailers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  genre text,
  views int default 0,
  likes int default 0,
  dislikes int default 0,
  created_at timestamptz default now()
);

alter table trailers enable row level security;

create policy "Public read trailers" on trailers for select using (true);
create policy "Admin insert trailers" on trailers for insert with check (auth.role() = 'authenticated');
create policy "Admin update trailers" on trailers for update using (auth.role() = 'authenticated');
create policy "Admin delete trailers" on trailers for delete using (auth.role() = 'authenticated');

create or replace function increment_trailer_views(trailer_id uuid)
returns void as $$
  update trailers set views = views + 1 where id = trailer_id;
$$ language sql security definer;

-- Songs table
create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  description text,
  audio_url text not null,
  thumbnail_url text,
  genre text,
  duration int,
  views int default 0,
  likes int default 0,
  dislikes int default 0,
  created_at timestamptz default now()
);

alter table songs enable row level security;

create policy "Public read songs" on songs for select using (true);
create policy "Admin insert songs" on songs for insert with check (auth.role() = 'authenticated');
create policy "Admin update songs" on songs for update using (auth.role() = 'authenticated');
create policy "Admin delete songs" on songs for delete using (auth.role() = 'authenticated');

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
