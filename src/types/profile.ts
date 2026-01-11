export interface ProfileSii {
  SiiNunit: ProfileSiiNunit;
}

export interface ProfileSiiNunit {
  user_profile: UserProfile[];
}

export interface UserProfile {
  id: string;
  face: number;
  brand: string;
  map_path: string;
  logo: string;
  company_name: string;
  male: boolean;
  cached_experience: number;
  cached_distance: number;
  user_data: (number | string)[];
  active_mods: number;
  customization: number;
  cached_stats: number[];
  cached_discovery: number[];
  version: number;
  online_user_name: string;
  online_password: string;
  profile_name: string;
  creation_time: number;
  save_time: number;
}
