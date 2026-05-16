export interface SignupResponse {
  uid: string;
  email: string;
  idToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  uid: string;
  email: string;
  idToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  idToken: string;
  refreshToken: string;
}
