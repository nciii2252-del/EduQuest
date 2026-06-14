// Test script untuk cek Supabase storage buckets
import { supabase } from '@/integrations/supabase/client';

export const testBuckets = async () => {
  console.log('🔍 Testing Supabase Storage Buckets...');

  try {
    // Test bucket materi_files
    console.log('📁 Testing materi_files bucket...');
    const { data: materiData, error: materiError } = await supabase.storage
      .from('materi_files')
      .list('', { limit: 1 });

    if (materiError) {
      console.error('❌ materi_files bucket error:', materiError);
    } else {
      console.log('✅ materi_files bucket OK');
    }

    // Test bucket quiz_files
    console.log('📁 Testing quiz_files bucket...');
    const { data: quizData, error: quizError } = await supabase.storage
      .from('quiz_files')
      .list('', { limit: 1 });

    if (quizError) {
      console.error('❌ quiz_files bucket error:', quizError);
    } else {
      console.log('✅ quiz_files bucket OK');
    }

  } catch (err) {
    console.error('❌ Test failed:', err);
  }
};

// Jalankan test
testBuckets();