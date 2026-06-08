import { supabase } from './supabase'

export type Banner = {
  id: string
  image_url: string
  created_at: string
}

export async function fetchBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(3)
  if (error) throw error
  return data ?? []
}

export async function addBanner(file: File): Promise<void> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${Date.now()}.${ext}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('banner-images')
    .upload(filename, file)
  if (uploadError) throw uploadError
  const { data: urlData } = supabase.storage
    .from('banner-images')
    .getPublicUrl(uploadData.path)
  const { error: insertError } = await supabase
    .from('banners')
    .insert({ image_url: urlData.publicUrl })
  if (insertError) throw insertError
}

export async function deleteBanner(id: string, imageUrl: string): Promise<void> {
  const { error } = await supabase.from('banners').delete().eq('id', id)
  if (error) throw error
  const storagePath = imageUrl.split('/banner-images/').at(1)
  if (storagePath) {
    await supabase.storage.from('banner-images').remove([storagePath])
  }
}
