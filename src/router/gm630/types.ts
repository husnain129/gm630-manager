export interface ConnectedDevice {
  mac: string;
  ip?: string;
  hostname?: string;
  rssi?: number;
  band?: '2.4GHz' | '5GHz' | 'Ethernet';
  source: 'dhcp' | 'arp' | 'wlan';
  phyPort?: string;
  expiredTime?: number;
}

export interface MacFilterEntry {
  mac: string;
  index: number;
  enabled: boolean;
  nickname?: string;
}

export interface MacFilterState {
  mode: 'disabled' | 'blacklist' | 'whitelist';
  entries: MacFilterEntry[];
}

export interface DeviceInfo {
  model?: string;
  serialNumber?: string;
  hardwareVersion?: string;
  softwareVersion?: string;
  uptime?: string;
  ponMac?: string;
  ponMode?: string;
}

export interface WanStatus {
  connectionType?: string;
  connectionName?: string;
  ip?: string;
  gateway?: string;
  dns1?: string;
  dns2?: string;
  wanMac?: string;
  connectionStatus?: string;
  onlineDuration?: string;
}

export interface PonStatus {
  rxPower?: number;
  txPower?: number;
  temperature?: number;
  loidState?: string;
}

export interface RouterCredentials {
  host: string;
  username: string;
  password: string;
}
