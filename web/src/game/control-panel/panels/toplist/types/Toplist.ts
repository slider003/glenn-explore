export type ToplistCategory = 'time' | 'kilometers';

export interface ToplistEntry {
    playerId: string;
    playerName: string;
    rank: number;
    value: number;  // Raw time or kilometers from backend
    valueString: string;  // Formatted time or kilometers from backend
}