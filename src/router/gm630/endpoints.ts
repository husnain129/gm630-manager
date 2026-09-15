// Verified endpoint map for GM630 XPON ONT (ZTE firmware, not Realtek)
// Server: Mini web server 1.0 ZTE corp 2005
// All paths verified by live probe on 2026-09-15

export const ENDPOINTS = {
  // Auth — POSTs to / (empty action), token extracted from JS each time
  // Fields: action=login, username, Password (capital P), Frm_Logintoken (from JS), frashnum=
  // Success: 302 → /start.ghtml. Failure: 200 with login page. Lockout after 3 failures (60s).
  // Session: IP-based, no cookies. _SESSION_TOKEN embedded in each page's JS for form POSTs.
  login: {
    path: '/',
    method: 'POST' as const,
    fields: {
      action: 'action',       // value: "login"
      username: 'username',
      password: 'Password',   // capital P — NOT "psd"
      token: 'Frm_Logintoken', // dynamic — extract from: getObj("Frm_Logintoken").value = "N"
      frashnum: 'frashnum',   // value: "" (empty)
    },
    verified: true,
  },

  // All pages use the same URL pattern: GET /getpage.gch?pid=1002&nextpage=<Page>_t.gch
  // Data is embedded in HTML as:
  //   (a) Transfer_meaning('FieldName', 'encoded\x3avalue') JS calls  — most pages
  //   (b) HTML entity encoded <td> cells with id="Frm_FieldName"     — status pages
  // Form submissions POST to the same URL as the GET.
  // Every POST must include _SESSION_TOKEN (extracted from: var session_token = "...").

  deviceInfo: {
    path: '/getpage.gch?pid=1002&nextpage=status_dev_info_t.gch',
    method: 'GET' as const,
    // Data format: HTML entities in <td id="Frm_ModelName">, <td id="Frm_SerialNumber"> etc.
    fields: {
      model: 'Frm_ModelName',
      serial: 'Frm_SerialNumber',
      hardwareVersion: 'Frm_HardwareVer',
      softwareVersion: 'Frm_SoftwareVer',
      uptime: 'Frm_UpTime',
      ponMac: 'Frm_PonMac',
      ponType: 'Frm_PonType',
      ponMode: 'Frm_PonMode',
      gponSn: 'Frm_Sn',
    },
    verified: true,
  },

  wanStatus: {
    path: '/getpage.gch?pid=1002&nextpage=status_ethwan_if_t.gch',
    method: 'GET' as const,
    // Data format: HTML entities in <td> cells (no IDs — parsed by table row label text)
    // Labels: Type, Connection Name, NAT, IP, DNS1, DNS2, WAN MAC, Gateway, Connection Status, Online Duration
    verified: true,
  },

  ponStatus: {
    path: '/getpage.gch?pid=1002&nextpage=gpon_status_link_t.gch',
    method: 'GET' as const,
    // Data: Transfer_meaning — minimal fields (LoidState, FecEnable only). Optical power not exposed.
    verified: true,
  },

  // Connected devices — DHCP lease table is the primary source
  // PhyPortName: SSID1–4 = 2.4 GHz, SSID5–8 = 5 GHz
  dhcpLeases: {
    path: '/getpage.gch?pid=1002&nextpage=net_dhcp_dynamic_t.gch',
    method: 'GET' as const,
    // Data: Transfer_meaning indexed by i (0..IF_INSTNUM-1)
    // Fields per entry: HostName{i}, MACAddr{i}, IPAddr{i}, ExpiredTime{i}, PhyPortName{i}, PhyType{i}
    verified: true,
  },

  // ARP table (connected devices — secondary source, includes wired)
  arpTable: {
    path: '/getpage.gch?pid=1002&nextpage=diag_netDiag_arpTable_t.gch',
    method: 'GET' as const,
    verified: true,
  },

  // MAC access control
  macFilter: {
    path: '/getpage.gch?pid=1002&nextpage=sec_macfilter_conf_t.gch',
    method: 'GET' as const,
    // Global state: Transfer_meaning('MacFilterTarget','Permit'|'Deny'), Transfer_meaning('MacFilterEnable','1'|'0')
    // Per-entry indexed by i (0..IF_INSTNUM-1):
    //   Enable{i}, BlackList{i}, Type{i}='Bridge+Route', Protocol{i}='ALL',
    //   SrcMacAddr{i}, DstMacAddr{i}='00:00:00:00:00:00', Port{i}=''
    // MacFilterTarget 'Permit' = whitelist (only listed MACs allowed)
    // MacFilterTarget 'Deny'   = blacklist (listed MACs blocked)
    verified: true,
  },
  macFilterAdd: {
    path: '/getpage.gch?pid=1002&nextpage=sec_macfilter_conf_t.gch',
    method: 'POST' as const,
    // Required fields: IF_ACTION=new, IF_INDEX=-1, _SESSION_TOKEN,
    //   Enable=1, BlackList=1, Type=Bridge+Route, Protocol=ALL,
    //   SrcMacAddr=<mac>, DstMacAddr=00:00:00:00:00:00, Port=
    verified: true,
  },
  macFilterDelete: {
    path: '/getpage.gch?pid=1002&nextpage=sec_macfilter_conf_t.gch',
    method: 'POST' as const,
    // Required fields: IF_ACTION=delete, IF_INDEX=<row_index>, _SESSION_TOKEN
    verified: true,
  },
  macFilterSetMode: {
    path: '/getpage.gch?pid=1002&nextpage=sec_macfilter_conf_t.gch',
    method: 'POST' as const,
    // Required fields: IF_ACTION=basic_apply, MacFilterEnable=1|0, MacFilterTarget=Permit|Deny, _SESSION_TOKEN
    verified: true,
  },

  // Wi-Fi config
  wlanInfo: {
    path: '/getpage.gch?pid=1002&nextpage=status_wlaninfo_t.gch',
    method: 'GET' as const,
    verified: true,
  },

  // Maintenance — paths not yet tested but follow the same getpage.gch pattern
  reboot: {
    path: '/getpage.gch?pid=1002&nextpage=manager_dev_conf_t.gch',
    method: 'POST' as const,
    // Candidate — needs probe to confirm field names
    verified: false,
  },
} as const;

// Session token extraction pattern (from any page JS):
//   var session_token = "<TOKEN>";
export const SESSION_TOKEN_REGEX = /var session_token\s*=\s*"([^"]+)"/;

// Login token extraction pattern (from login page JS):
//   getObj("Frm_Logintoken").value = "N";
export const LOGIN_TOKEN_REGEX = /getObj\("Frm_Logintoken"\)\.value\s*=\s*"([^"]+)"/;
