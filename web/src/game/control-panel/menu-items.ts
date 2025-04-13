import { MenuItem } from './ControlPanelTypes';
import { CinematicPanel } from './panels/CinematicPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { DonationPanel } from './panels/DonationPanel';
import { ToplistPanel } from './panels/toplist/ToplistPanel';
import { RadioPanel } from './panels/radio/RadioPanel';
import { TimeTrialPanel } from '../racing/TimeTrialPanel';
import { TheaterPanel } from './panels/theater/TheaterPanel';

export const MENU_ITEMS: () => MenuItem[] = () => [
  {
    id: 'time-trial',
    emoji: '🏁',
    label: 'Racing',
    panel: TimeTrialPanel
  },
  {
    id: 'toplist',
    emoji: '🏆',
    label: 'Toplist',
    panel: ToplistPanel
  },
  ...(window.isSmallScreen ? [] : [
    {
      id: 'theater',
      emoji: '🎬',
      label: 'Theater',
      panel: TheaterPanel
    }
  ]),
  {
    id: 'cinematic',
    emoji: '🎥',
    label: 'Cinematic',
    panel: CinematicPanel
  },
  {
    id: 'radio',
    emoji: '📻',
    label: 'Radio',
    panel: RadioPanel
  },
  {
    id: 'settings',
    emoji: '⚙️',
    label: 'Settings',
    panel: SettingsPanel
  },
]; 