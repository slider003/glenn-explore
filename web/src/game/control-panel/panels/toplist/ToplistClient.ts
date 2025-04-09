import { ToplistCategory, ToplistEntry } from './types/Toplist';

export class ToplistClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = `/api/toplist`;
    }

    /**
     * Fetch the time-based toplist
     */
    public async getTimeToplist(): Promise<ToplistEntry[]> {
        return this.fetchToplist('time');
    }

    public async getKilometersToplist(): Promise<ToplistEntry[]> {
        return this.fetchToplist('kilometers');
    }

    private async fetchToplist(category: ToplistCategory): Promise<ToplistEntry[]> {
        const response = await fetch(`${this.baseUrl}/${category}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch toplist: ${response.statusText}`);
        }

        return response.json();
    }
} 