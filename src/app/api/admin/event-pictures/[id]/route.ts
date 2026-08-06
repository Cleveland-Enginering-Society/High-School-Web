// Written by GitHub Copilot (adapted)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/roles';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';

function parseSupabasePublicUrl(urlString: string) {
  try {
    const url = new URL(urlString);
    const marker = '/object/public/';
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    const rest = url.pathname.substring(idx + marker.length);
    const parts = rest.split('/');
    const bucket = parts.shift();
    if (!bucket) return null;
    const path = parts.join('/');
    return { bucket: decodeURIComponent(bucket), path: decodeURIComponent(path) };
  } catch (e) {
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await checkIsAdmin(supabase, user.id))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    const { data: pictureRow, error: fetchError } = await supabase
      .from('EventPictures')
      .select('id, image_url')
      .eq('id', id)
      .single();

    if (fetchError || !pictureRow) {
      return NextResponse.json({ error: 'Picture not found' }, { status: 404 });
    }

    const serviceSupabase = createServiceRoleClient();
    const dbClient = serviceSupabase ?? supabase;

    const imageUrl: string | undefined = (pictureRow as any).image_url;
    let storageDeletedWarning: string | undefined;

    if (imageUrl) {
      const parsed = parseSupabasePublicUrl(imageUrl);
      if (parsed) {
        const { bucket, path } = parsed;
        const { error: storageError } = await dbClient.storage.from(bucket).remove([path]);
        if (storageError) {
          storageDeletedWarning = `Failed to delete storage object: ${storageError.message}`;
        }
      } else {
        storageDeletedWarning = 'Could not parse storage path from image URL; storage object not removed.';
      }
    }

    const { error: deleteError } = await dbClient.from('EventPictures').delete().eq('id', id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    const response: any = { success: true };
    if (storageDeletedWarning) response.warning = storageDeletedWarning;

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting event picture:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
