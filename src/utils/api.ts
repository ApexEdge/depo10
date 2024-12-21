import { supabase } from './supabase';

export interface Rating {
  id: string;
  rating: number;
  created_at: string;
  comment?: string;
  timestamp?: string; // Add timestamp for better sorting
}

interface ApiResponse<T> {
  data: T;
  error?: string;
}

const IS_DEV = import.meta.env.DEV;
const IS_BROWSER = typeof window !== 'undefined';
const BASE_URL = IS_DEV 
  ? 'http://localhost:4321'
  : 'https://ratings-api-rouge.vercel.app';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.message.includes('Could not establish connection')) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

async function sendMessageToExtension(extensionId, message) {
  return new Promise((resolve, reject) => {
    window.chrome.runtime.sendMessage(
      extensionId,
      message,
      (result) => {
        if (!window.chrome.runtime.lastError) {
          console.log('Message processed successfully:', result);
          resolve(result);
        } else {
          console.error('Error sending message:', window.chrome.runtime.lastError);
          reject(window.chrome.runtime.lastError);
        }
      }
    );
  });
}

export async function fetchRatings(): Promise<ApiResponse<Rating[]>> {
  return withRetry(async () => {
    try {
      console.log('Fetching ratings from Supabase...');
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .order('created_at', { ascending: false })
        .throwOnError();  // This ensures errors are properly caught

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Ensure we're working with fresh data
      const freshData = data?.map(rating => ({
        ...rating,
        timestamp: new Date(rating.created_at).getTime()
      }));

      console.log('Received fresh ratings:', freshData);
      return { data: freshData || [] };
    } catch (error) {
      console.error('API Error:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}

export async function createRating(rating: Omit<Rating, 'id' | 'created_at'>): Promise<ApiResponse<Rating>> {
  return withRetry(async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .insert([
          { 
            rating: rating.rating,
            comment: rating.comment 
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return {
        data: {} as Rating,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}

export interface RatingSummary {
  total: number;
  average: number;
  monthly: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export async function getRatingSummary(): Promise<{ data: RatingSummary | null, error: Error | null }> {
  return withRetry(async () => {
    try {
      // Force fresh data fetch
      // Cache purging is not supported, consider other ways to ensure fresh data
      const { data: ratings, error: fetchError } = await fetchRatings();
      
      if (fetchError || !ratings) {
        return {
          data: {
            total: 0,
            average: 0,
            monthly: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          error: null
        };
      }

      // Reset distribution counts
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      // Count fresh distribution
      ratings.forEach(rating => {
        const ratingValue = Math.round(rating.rating); // Ensure integer
        if (ratingValue >= 1 && ratingValue <= 5) {
          distribution[ratingValue as keyof typeof distribution]++;
        }
      });

      const totalRatings = ratings.length;
      const averageRating = totalRatings > 0 
        ? Number((ratings.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings).toFixed(2))
        : 0;
        
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const currentMonthRatings = ratings.filter(rating => {
        const ratingDate = new Date(rating.created_at);
        return ratingDate.getMonth() === currentMonth && 
               ratingDate.getFullYear() === currentYear;
      }).length;

      const summary = {
        total: totalRatings,
        average: averageRating,
        monthly: currentMonthRatings,
        distribution
      };

      console.log('Generated fresh summary:', summary);
      return { data: summary, error: null };
    } catch (error) {
      console.error('Summary Error:', error);
      return {
        data: {
          total: 0,
          average: 0,
          monthly: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        },
        error: null
      };
    }
  });
}
