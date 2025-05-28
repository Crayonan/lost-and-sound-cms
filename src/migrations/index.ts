import * as migration_20250527_033816_add_begin_time_tz from './20250527_033816_add_begin_time_tz';

export const migrations = [
  {
    up: migration_20250527_033816_add_begin_time_tz.up,
    down: migration_20250527_033816_add_begin_time_tz.down,
    name: '20250527_033816_add_begin_time_tz'
  },
];
