export type Rsp<T> = {
  status: {
    code: 0 | 1 | 2 | 3 | 4 | 5 | 401 | 403 | 404 | 503;
    message: string;
  };
  data: T;
};

export type Configuration = {
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

export function createOkResponse<T>(data: T): Rsp<T> {
  return {
    status: {
      code: 1,
      message: "OK",
    },
    data,
  };
}
