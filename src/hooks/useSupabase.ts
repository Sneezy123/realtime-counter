export interface CounterGroup {
  id: string;
  name: string;
  display_name: string;
  profile_image_url?: string | null;
  access_key_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Counter {
  id: string;
  group_id: string;
  name: string;
  description: string;
  value: number;
  increment_step: number;
  decrement_step: number;
  thumbnail_url?: string | null;
  created_at: string;
  updated_at: string;
}

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type");
  let data;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      typeof data === "object" && data !== null ? (data as any).error : data;
    throw new Error(
      errorMsg || `API request failed with status ${response.status}`,
    );
  }

  return data;
};
