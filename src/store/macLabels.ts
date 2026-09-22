import { File, Paths } from 'expo-file-system';
import { create } from 'zustand';

const labelsFile = new File(Paths.document, 'mac-labels.json');

function loadSync(): Record<string, string> {
  try {
    if (!labelsFile.exists) return {};
    return JSON.parse(labelsFile.textSync()) as Record<string, string>;
  } catch {
    return {};
  }
}

function saveSync(data: Record<string, string>): void {
  try {
    labelsFile.write(JSON.stringify(data));
  } catch {
    // non-fatal
  }
}

interface MacLabelsStore {
  labels: Record<string, string>;
  setLabel: (mac: string, label: string) => void;
  removeLabel: (mac: string) => void;
}

export const useMacLabels = create<MacLabelsStore>((set, get) => ({
  labels: loadSync(),
  setLabel: (mac, label) => {
    const trimmed = label.trim();
    const next = { ...get().labels };
    if (trimmed) {
      next[mac.toLowerCase()] = trimmed;
    } else {
      delete next[mac.toLowerCase()];
    }
    saveSync(next);
    set({ labels: next });
  },
  removeLabel: (mac) => {
    const next = { ...get().labels };
    delete next[mac.toLowerCase()];
    saveSync(next);
    set({ labels: next });
  },
}));
