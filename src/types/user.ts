export interface User {
    id: string;
    provider: string;
    displayName: string;
    emails?: { value: string }[];
    photos?: { value: string }[];
    accessToken: string;
    refreshToken: string;
  }
