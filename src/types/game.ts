export interface GameSii {
  SiiNunit: GameSiiNunit;
}

export interface GameSiiNunit {
  economy: Economy[];
  bank: Bank[];
  player: Player[];
  trailer: Trailer[];
  vehicle_accessory: VehicleAccessory[];
  vehicle_paint_job_accessory: VehiclePaintJobAccessory[];
  vehicle_addon_accessory: VehicleAddonAccessory[];
  vehicle_wheel_accessory: VehicleWheelAccessory[];
  vehicle_cargo_accessory: VehicleCargoAccessory[];
  trailer_utilization_log: TrailerUtilizationLog[];
  trailer_utilization_log_entry: TrailerUtilizationLogEntry[];
  trailer_def: TrailerDef[];
  vehicle: Vehicle[];
  vehicle_drv_plate_accessory: VehicleDrvPlateAccessory[];
  profit_log: ProfitLog[];
  profit_log_entry: ProfitLogEntry[];
  driver_player: DriverPlayer[];
  driver_ai: DriverAi[];
  job_info: JobInfo[];
  company: Company[];
  job_offer_data: JobOfferDaum[];
  garage: Garage[];
  game_progress: GameProgress[];
  transport_data: TransportData[];
  economy_event_queue: EconomyEventQueue[];
  economy_event: EconomyEvent[];
  mail_ctrl: MailCtrl[];
  mail_def: MailDef[];
  oversize_offer_ctrl: OversizeOfferCtrl[];
  oversize_route_offers: OversizeRouteOffers[];
  oversize_offer: OversizeOffer[];
  delivery_log: DeliveryLog[];
  delivery_log_entry: DeliveryLogEntry[];
  ferry_log: FerryLog[];
  ferry_log_entry: FerryLogEntry[];
  police_offence_log: PoliceOffenceLog[];
  police_offence_log_entry: PoliceOffenceLogEntry[];
  police_ctrl: PoliceCtrl[];
  map_action: MapAction[];
  used_vehicle_assortment: UsedVehicleAssortment[];
  used_truck_offer: UsedTruckOffer[];
  registry: Registry[];
  bus_stop: BusStop[];
  bus_job_log: BusJobLog[];
}

export interface Economy {
  id: string;
  bank: string;
  player: string;
  companies: string[];
  garages: string[];
  garage_ignore_list: number;
  game_progress: string;
  event_queue: string;
  mail_ctrl: string;
  oversize_offer_ctrl: string;
  game_time: number;
  game_time_secs: number;
  game_time_initial: number;
  achievements_added: number;
  new_game: boolean;
  total_distance: number;
  experience_points: number;
  adr: number;
  long_dist: number;
  heavy: number;
  fragile: number;
  urgent: number;
  mechanical: number;
  user_colors: (number | null)[];
  delivery_log: string;
  ferry_log: string;
  police_offence_log: string;
  stored_camera_mode: number;
  stored_actor_state: number;
  stored_high_beam_style: number;
  stored_actor_windows_state: number[];
  stored_actor_wiper_mode: number;
  stored_actor_retarder: number;
  stored_display_mode_on_dashboard: number;
  stored_display_mode_on_gps: number;
  stored_dashboard_map_mode: number;
  stored_world_map_zoom: number;
  stored_online_job_id: number;
  stored_online_gps_behind: number;
  stored_online_gps_ahead: number;
  stored_online_gps_behind_waypoints: number;
  stored_online_gps_ahead_waypoints: number;
  stored_online_gps_avoid_waypoints: number;
  stored_special_job: null;
  police_ctrl: string;
  stored_map_state: number;
  stored_gas_pump_money: number;
  stored_weather_change_timer: number;
  stored_current_weather: number;
  stored_rain_wetness: number;
  time_zone: number;
  time_zone_name: string;
  last_ferry_position: number[];
  stored_show_weigh: boolean;
  stored_need_to_weigh: boolean;
  stored_nav_start_pos: number[];
  stored_nav_end_pos: number[];
  stored_gps_behind: number;
  stored_gps_ahead: number;
  stored_gps_behind_waypoints: number;
  stored_gps_ahead_waypoints: number;
  stored_gps_avoid_waypoints: number;
  stored_start_tollgate_pos: number[];
  stored_tutorial_state: number;
  stored_map_actions: string[];
  clean_distance_counter: number;
  clean_distance_max: number;
  no_cargo_damage_distance_counter: number;
  no_cargo_damage_distance_max: number;
  no_violation_distance_counter: number;
  no_violation_distance_max: number;
  total_real_time: number;
  real_time_seconds: number;
  visited_cities: string[];
  visited_cities_count: number[];
  last_visited_city: string;
  discovered_cutscene_items: number[];
  discovered_cutscene_items_states: number[];
  unlocked_dealers: string[];
  unlocked_recruitments: 0 | string[];
  total_screeshot_count: number;
  undamaged_cargo_row: number;
  service_visit_count: number;
  last_service_pos: number[];
  gas_station_visit_count: number;
  last_gas_station_pos: number[];
  emergency_call_count: number;
  ai_crash_count: number;
  truck_color_change_count: number;
  red_light_fine_count: number;
  cancelled_job_count: number;
  total_fuel_litres: number;
  total_fuel_price: number;
  transported_cargo_types: string[];
  achieved_feats: number;
  discovered_roads: number;
  discovered_items: number[];
  drivers_offer: 0 | string[];
  default_training_policy: string;
  used_vehicle_assortment: string;
  freelance_truck_offer: null;
  trucks_bought_online: number;
  special_cargo_timer: number;
  screen_access_list: string[];
  screen_visit_list: number;
  driver_pool: string[];
  registry: string;
  company_jobs_invitation_sent: boolean;
  company_check_hash: number;
  relations: number[];
  bus_stops: string[];
  bus_job_log: string;
  bus_experience_points: number;
  bus_total_distance: number;
  bus_finished_job_count: number;
  bus_cancelled_job_count: number;
  bus_total_passengers: number;
  bus_total_stops: number;
  bus_game_time: number;
  bus_playing_time: number;
}

export interface Bank {
  id: string;
  money_account: number;
  coinsurance_fixed: number;
  coinsurance_ratio: number;
  accident_severity: number;
  loans: number;
  app_enabled: boolean;
  loan_limit: number;
  payment_timer: number;
  overdraft: boolean;
  overdraft_timer: number;
  overdraft_warn_count: number;
  sell_players_truck_later: boolean;
  sell_players_trailer_later: boolean;
}

export interface Player {
  id: string;
  hq_city: string;
  trailers: string[];
  trailer_utilization_logs: string[];
  trailer_defs: string[];
  assigned_truck: string;
  my_truck: string;
  my_truck_placement: number[][];
  my_truck_placement_valid: boolean;
  my_trailer_placement: number[][];
  my_slave_trailer_placements: number;
  my_trailer_attached: boolean;
  my_trailer_used: boolean;
  assigned_trailer: string | null;
  my_trailer: string | null;
  assigned_trailer_connected: boolean;
  truck_placement: number[][];
  trailer_placement: number[][];
  slave_trailer_placements: number;
  schedule_transfer_to_hq: boolean;
  schedule_quick_travel: boolean;
  flags: number;
  gas_pump_money_debt: number;
  current_job: null;
  current_bus_job: null;
  selected_job: null;
  driving_time: number;
  sleeping_count: number;
  free_roam_distance: number;
  discovary_distance: number;
  dismissed_drivers: number;
  trucks: string[];
  truck_profit_logs: string[];
  drivers: string[];
  driver_flags: number[];
  driver_readiness_timer: number[];
  driver_undrivable_truck_timers: number[];
  driver_quit_warned: number;
}

export interface Trailer {
  id: string;
  trailer_definition: string | null;
  oversize: boolean;
  cargo_mass: number;
  cargo_damage: number;
  virtual_rear_wheels_offset: number;
  slave_trailer: string | null;
  is_private: boolean;
  trailer_body_wear: number | string;
  trailer_body_wear_unfixable: number | string;
  accessories: string[];
  odometer: number;
  odometer_float_part: number | string;
  integrity_odometer: number;
  integrity_odometer_float_part: number | string;
  trip_fuel_l: number;
  trip_fuel: number;
  trip_recuperation_kwh: number;
  trip_recuperation: number;
  trip_distance_km: number;
  trip_distance: number;
  trip_time_min: number;
  trip_time: number;
  license_plate: string;
  chassis_wear: number | string;
  chassis_wear_unfixable: number | string;
  wheels_wear: 0 | (number | string)[];
  wheels_wear_unfixable: 0 | (number | string)[];
  sliding_axle_offset: number;
}

export interface VehicleAccessory {
  id: string;
  data_path: string;
  refund: number;
}

export interface VehiclePaintJobAccessory {
  id: string;
  mask_r_color: number[];
  mask_g_color: number[];
  mask_b_color: number[];
  flake_color: number[];
  flip_color: number[];
  base_color: number[];
  data_path: string;
  refund: number;
}

export interface VehicleAddonAccessory {
  id: string;
  slot_name: 0 | string[];
  slot_hookup: 0 | (string | null)[];
  paint_color: number[];
  data_path: string;
  refund: number;
}

export interface VehicleWheelAccessory {
  id: string;
  offset: number;
  paint_color: number[];
  data_path: string;
  refund: number;
}

export interface VehicleCargoAccessory {
  id: string;
  cargo_data: string | null;
  model_seed: number;
  loading_method: string;
  lashing_method: string;
  lashing_gear_type: string;
  lashing_hook_angle_constraints: number[];
  units_to_visualize: number;
  models_count: number;
  model_dimensions: number[];
  data_path: string;
  refund: number;
}

export interface TrailerUtilizationLog {
  id: string;
  entries: 0 | string[];
  total_driven_distance_km: number;
  total_transported_cargoes: number;
  total_transported_weight: number | string;
}

export interface TrailerUtilizationLogEntry {
  id: string;
  economy_day: number;
  use_time: number;
}

export interface TrailerDef {
  id: string;
  trailer: string;
  gross_trailer_weight_limit: number;
  chassis_mass: number;
  body_mass: number;
  axles: number;
  volume: number;
  body_type: string;
  chain_type: string;
  country_validity: 0 | string[];
  mass_ratio: number[] | string[];
  length: number | string;
  source_name: string;
}

export interface Vehicle {
  id: string;
  engine_wear: number;
  transmission_wear: number;
  cabin_wear: number;
  engine_wear_unfixable: number;
  transmission_wear_unfixable: number;
  cabin_wear_unfixable: number;
  fuel_relative: number;
  rheostat_factor: number;
  user_mirror_rot: 0 | number[][];
  user_head_offset: number[];
  user_fov: number;
  user_wheel_up_down: number;
  user_wheel_front_back: number;
  user_mouse_left_right_default: number;
  user_mouse_up_down_default: number;
  accessories: string[];
  odometer: number;
  odometer_float_part: number;
  integrity_odometer: number;
  integrity_odometer_float_part: number;
  trip_fuel_l: number;
  trip_fuel: number;
  trip_recuperation_kwh: number;
  trip_recuperation: number;
  trip_distance_km: number;
  trip_distance: number;
  trip_time_min: number;
  trip_time: number;
  license_plate: string;
  chassis_wear: number;
  chassis_wear_unfixable: number;
  wheels_wear: 0 | number[];
  wheels_wear_unfixable: 0 | number[];
  sliding_axle_offset: number;
}

export interface VehicleDrvPlateAccessory {
  id: string;
  text: string;
  slot_name: 0 | string[];
  slot_hookup: 0 | string[];
  paint_color: number[];
  data_path: string;
  refund: number;
}

export interface ProfitLog {
  id: string;
  stats_data: 0 | string[];
  acc_distance_free: number;
  acc_distance_on_job: number;
  history_age: number | null;
}

export interface ProfitLogEntry {
  id: string;
  revenue: number;
  wage: number;
  maintenance: number;
  fuel: number;
  distance: number;
  distance_on_job: boolean;
  cargo_count: number;
  cargo: string;
  source_city: string;
  source_company: string;
  destination_city: string;
  destination_company: string;
  timestamp_day: number;
}

export interface DriverPlayer {
  id: string;
  profit_log: string;
}

export interface DriverAi {
  id: string;
  adr: number;
  long_dist: number;
  heavy: number;
  fragile: number;
  urgent: number;
  mechanical: number;
  hometown: string;
  current_city: string;
  state: number;
  on_duty_timer: number;
  extra_maintenance: number;
  driver_job: string;
  experience_points: number;
  training_policy: number;
  adopted_truck: string | null;
  assigned_truck: string | null;
  assigned_truck_efficiency: number;
  assigned_truck_axle_count: number;
  assigned_truck_mass: number;
  slot_truck_efficiency: number;
  slot_truck_axle_count: number;
  slot_truck_mass: number;
  adopted_trailer: string | null;
  assigned_trailer: string | null;
  old_hometown: string;
  profit_log: string;
}

export interface JobInfo {
  id: string;
  cargo: string | null;
  source_company: string | null;
  target_company: string | null;
  cargo_model_index: number;
  is_articulated: boolean;
  is_cargo_market_job: boolean;
  start_time: number;
  planned_distance_km: number;
  ferry_time: number;
  ferry_price: number;
  urgency: number | null;
  special: null;
  units_count: number;
  fill_ratio: number;
}

export interface Company {
  id: string;
  permanent_data: string;
  delivered_trailer: string | null;
  delivered_pos: 0 | number[][][];
  job_offer: 0 | string[];
  cargo_offer_seeds: number[];
  discovered: boolean;
  reserved_trailer_slot: null;
  state: number;
}

export interface JobOfferDaum {
  id: string;
  target: string;
  expiration_time: number | null;
  urgency: number | null;
  shortest_distance_km: number;
  ferry_time: number;
  ferry_price: number;
  cargo: string | null;
  company_truck: string;
  trailer_variant: string | null;
  trailer_definition: string | null;
  units_count: number;
  fill_ratio: number;
  trailer_place: 0 | number[][][];
}

export interface Garage {
  id: string;
  vehicles: 0 | (string | null)[];
  drivers: 0 | (string | null)[];
  trailers: 0 | string[];
  status: number;
  profit_log: string;
  productivity: number;
}

export interface GameProgress {
  id: string;
  generic_transports: string;
  undamaged_transports: string;
  clean_transports: string;
  owned_trucks: string[];
}

export interface TransportData {
  id: string;
  distance: number;
  time: number;
  money: number;
  count_per_adr: number[];
  docks: string[];
  count_per_dock: number[];
}

export interface EconomyEventQueue {
  id: string;
  data: string[];
}

export interface EconomyEvent {
  id: string;
  time: number;
  unit_link: string;
  param: number;
}

export interface MailCtrl {
  id: string;
  inbox: string[];
  last_id: number;
  unread_count: number;
  pending_mails: number;
  pmail_timers: number;
}

export interface MailDef {
  id: number;
  mail_text_ref: string;
  param_keys: 0 | string[];
  param_values: 0 | string[];
  read: boolean;
  accepted: boolean;
  expired: boolean;
  custom_data: number;
}

export interface OversizeOfferCtrl {
  id: string;
  route_offers: 0 | string[];
}

export interface OversizeRouteOffers {
  id: string;
  offers: (string | null)[];
  route: string;
}

export interface OversizeOffer {
  id: string;
  offer_data: string;
  truck: string;
  expiration: number;
  intro_cutscene: string;
  outro_cutscene: string;
}

export interface DeliveryLog {
  id: string;
  version: number;
  entries: string[];
  cached_jobs_count: number;
}

export interface DeliveryLogEntry {
  id: string;
  params: (number | string)[];
}

export interface FerryLog {
  id: string;
  entries: string[];
}

export interface FerryLogEntry {
  id: string;
  ferry: string;
  connection: string;
  last_visit: number;
  use_count: number;
}

export interface PoliceOffenceLog {
  id: string;
  detailed_history_entries: string[];
  offence_total_counts: number[];
  offence_total_fines: number[];
}

export interface PoliceOffenceLogEntry {
  id: string;
  game_time: number;
  type: number;
  fine: number;
}

export interface PoliceCtrl {
  id: string;
  offence_timer: number[];
  offence_counter: number[];
  offence_valid: boolean[];
}

export interface MapAction {
  id: string;
  id_params: 0 | number[];
  name: string;
  command: string;
  num_params: 0 | number[];
  str_params: 0 | string[];
  target_tags: number;
  target_range: number;
  type: string;
}

export interface UsedVehicleAssortment {
  id: string;
  next_generation_game_time: number;
  trucks: string[];
}

export interface UsedTruckOffer {
  id: string;
  lefthand_traffic: boolean;
  truck: string;
  price: number;
  expiration_game_time: number;
}

export interface Registry {
  id: string;
  data: number[];
  valid: boolean[];
  keys: number[];
  index: number[];
}

export interface BusStop {
  id: string;
  discovered: boolean;
  lines_offer: number;
}

export interface BusJobLog {
  id: string;
  version: number;
  entries: number;
}
