export interface InfoSii {
  SiiNunit: InfoSiiNunit;
}

export interface InfoSiiNunit {
  save_container: SaveContainer[];
}

export interface SaveContainer {
  id: string;
  name: string;
  time: number;
  file_time: number;
  version: number;
  info_version: number;
  dependencies: string[];
  info_players_experience: number;
  info_unlocked_recruitments: number;
  info_unlocked_dealers: number;
  info_visited_cities: number;
  info_money_account: number;
  info_explored_ratio: number;
}
