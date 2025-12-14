import { z } from "@zod/zod";

export type Rsp<T> = {
  status: {
    code: 0 | 1 | 2 | 3 | 4 | 5 | 401 | 403 | 404 | 503;
    message: string;
  };
  data: T;
};

export type PlayaConfiguration = {
  site_name: string;
  site_logo: string;
  auth?: boolean;
  auth_by_code?: boolean;
  actors: boolean;
  categories: boolean;
  categories_groups: boolean;
  studios: boolean;
  scripts: boolean;
  masks: boolean;
  analytics: boolean;
  theme?: number;
  ar?: boolean;
  nsfw?: boolean;
};

export type Page<T> = {
  page_index: number; // index of page (starting from 0)
  page_size: number; // Page size Eg 1: requested 20 items, but there are only 10. page_size should be 20.
  page_total: number; //Total count of pages (if item_total is 0 - page_total is 1)
  item_total: number; // Total count of items
  content: T[]; // Array of items. Each item is of type T. Page with 0 items should have an empty array.
};

type BaseVideo = {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  prevew_image: string; // URL to preview image
  release_date?: number; // Epock UNIX timestamp
};

export type VideoListView = BaseVideo & {
  details: VideoListDetails[]; // Trailer and Full video details. Both are optional.
  published?: boolean;
  etag?: string;
  ts?: number; // last modified timestamp
  has_scripts?: boolean; // default false
};

export type VideoListDetails = {
  type: "trailer" | "full";
  duration_seconds: number; // duration in seconds
  transparency_mode?: number; // default opaque
  has_scripts?: boolean; // default false
};

export type VideoView = BaseVideo & {
  description: string;
  studio?: Attribution[];
  categories?: Attribution[];
  actors?: Attribution[];
  views: number; // number of views
  transparency?: number; // transparency default opaque
  details: VideoViewDetails[];
};

export type VideoViewDetails = {
  type: "trailer" | "full";
  duration_seconds: number; // duration in seconds
  links: VideoLink[];
  alpha_mask?: string; // Optional Url to external alpha mask video. External mask should be enabled in TransparencyInfo.
  script_info?: {
    id: string;
    generation_source: 0 | 1; // 0 - Manual, 1 - AI
  };
  timeline_atlas?: {
    version: 1;
    url: string; // URL to timeline atlas image
    rows: number;
    columns: number;
  };
  timeline_markers?: {
    time: number; // time in milliseconds
    title: string; // chapter title
    tilt?: number; // Camera rotation (up, down) in degrees from -90 to 90. Positive values rotate camera up.
    zoom?: number; // Camera zoom is normalized in range from -1 to 1. Positive values bring video closer to camera.
    height?: number; // Camera height in normalized range from -1 to 1. Positive values move camera up.
  }[];
};

export type VideoLink =
  & (
    | {
      url: string; // URL to video file or stream
      unavailable_reason: null;
    }
    | {
      url: null;
      unavailable_reason: string;
    }
  )
  & {
    is_stream: boolean; // If true, hosting (CDN) must support HTTP range requests (partial requests).
    is_download: boolean; // If true, hosting (CDN) must respond with a nonzero Content-Length header.
    /* "FLT" - shown on flat display
    "180" - front half sphere
    "360" - full sphere
    "FSH" - fisheye */
    projection: "FLT" | "180" | "360" | "FSH";
    /* "MN" - mono.
    "LR" - stereo. Side by side. Left eye on left half.
    "RL" - stereo. Side by side. Left eye on right half.
    "TB" - stereo. Over under. Left eye on top half.
    "BT" - stereo. Over under. Left eye on bottom half. */
    stereo: "MN" | "LR" | "RL" | "TB" | "BT";
    quality_name: string; // Eg "1080p", "4K". Displayed to user
    /* Quality Range
    Quality	Middle	Range
    2K-	25	0..29
    3K	35	30..39
    4K	45	40..49
    5K	55	50..59
    6K	65	60..69
    7K	75	70..79
    8K+	85	80..100 */
    quality_order: number; // Used for ordering links by quality
  };

export type Attribution = {
  id: "string"; // must be unique
  title: string; // shown to user
};

export function createOkResponse<T>(data: T): Rsp<T> {
  return {
    status: {
      code: 1,
      message: "OK",
    },
    data,
  };
}

export const videosQuerySchema = z.object({
  "page-index": z.coerce.number().int().min(0).catch(0),
  "page-size": z.coerce.number().int().min(1).catch(12),
  order: z.string().min(1).catch("release_date"),
  direction: z.preprocess(
    (value: unknown) => (typeof value === "string" ? value.toLowerCase() : value),
    z.enum(["asc", "desc"]),
  ).catch("desc"),
});
